import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query, tx } from '../db.js';
import { AppError } from '../lib/errors.js';
import { evaluateAchievements } from '../lib/achievements.js';
import { enqueueNotification } from '../integrations/whatsapp.js';

export default async function shopRoutes(app: FastifyInstance) {
  const anyRole = app.auth(['student', 'parent', 'teacher', 'admin']);

  /** Каталог. Для ученика помечаем, что ему по карману. */
  app.get('/', { preHandler: anyRole }, async (req) => {
    const items = await query(
      `select id, title, description, image_url, kind, price_coins, stock
         from shop_items
        where is_active and (stock is null or stock > 0)
        order by sort_order, price_coins`);

    if (req.user!.role !== 'student') return { items, balance: null };

    const s = await one<{ coins_balance: number }>(
      `select coins_balance from students where user_id = $1`, [req.user!.id]);
    const owned = await query<{ item_id: string }>(
      `select item_id from student_inventory where student_id = $1`, [req.user!.id]);
    const ownedSet = new Set(owned.map((o) => o.item_id));
    const balance = s?.coins_balance ?? 0;

    return {
      balance,
      items: items.map((i: any) => ({
        ...i,
        affordable: i.price_coins <= balance,
        owned: i.kind === 'virtual' && ownedSet.has(i.id),
      })),
    };
  });

  /**
   * Покупка. Порядок важен:
   *   1) резервируем сток (UPDATE ... WHERE stock > 0) — защита от гонки
   *   2) создаём заказ
   *   3) списываем коины через apply_coins (он же проверит баланс)
   * Всё в одной транзакции: при нехватке коинов сток вернётся откатом.
   */
  app.post('/:itemId/buy', { preHandler: app.auth(['student']) }, async (req) => {
    const { itemId } = z.object({ itemId: z.string().uuid() }).parse(req.params);
    const studentId = req.user!.id;

    const result = await tx(async (c) => {
      const itemRes = await c.query(
        `select id, title, kind, price_coins, stock, is_active
           from shop_items where id = $1 for update`, [itemId]);
      const item = itemRes.rows[0];
      if (!item || !item.is_active) throw new AppError(404, 'NOT_FOUND', 'Товар не найден');

      if (item.kind === 'virtual') {
        const dup = await c.query(
          `select 1 from student_inventory where student_id=$1 and item_id=$2`, [studentId, itemId]);
        if (dup.rowCount) throw new AppError(400, 'ALREADY_OWNED', 'У тебя уже есть этот предмет');
      }

      if (item.stock !== null) {
        const dec = await c.query(
          `update shop_items set stock = stock - 1 where id = $1 and stock > 0 returning stock`, [itemId]);
        if (!dec.rowCount) throw new AppError(400, 'OUT_OF_STOCK', 'Товар закончился');
      }

      const orderRes = await c.query(
        `insert into orders (student_id, item_id, price_coins, status)
         values ($1,$2,$3, case when $4 = 'virtual' then 'issued' else 'pending' end)
         returning *`,
        [studentId, itemId, item.price_coins, item.kind]);
      const order = orderRes.rows[0];

      // Списание идёт через ту же SQL-функцию: она проверит, что баланс не уйдёт в минус.
      await c.query(
        `select apply_coins($1, $2, 0, 'purchase', $3, null, $4, $1, $5)`,
        [studentId, -item.price_coins, `Покупка: ${item.title}`, order.id, `buy:${order.id}`]);

      if (item.kind === 'virtual') {
        await c.query(
          `insert into student_inventory (student_id, item_id) values ($1,$2) on conflict do nothing`,
          [studentId, itemId]);
        await c.query(`update orders set issued_at = now() where id = $1`, [order.id]);
      }

      return { order, item };
    });

    await evaluateAchievements(studentId);

    if (result.item.kind !== 'virtual') {
      await notifyParentsAboutPurchase(studentId, result.item.title, result.item.price_coins);
    }

    return {
      ok: true,
      order_id: result.order.id,
      status: result.order.status,
      message: result.item.kind === 'virtual'
        ? 'Готово! Предмет уже в твоём инвентаре'
        : 'Готово! Забери на следующем уроке у преподавателя',
    };
  });

  /** Мои заказы. */
  app.get('/orders', { preHandler: app.auth(['student']) }, async (req) => {
    return query(
      `select o.id, o.status, o.price_coins, o.created_at, o.issued_at,
              i.title, i.kind, i.image_url
         from orders o join shop_items i on i.id = o.item_id
        where o.student_id = $1 order by o.created_at desc`, [req.user!.id]);
  });
}

async function notifyParentsAboutPurchase(studentId: string, title: string, price: number) {
  const rows = await query<{ parent_id: string; phone: string; child: string }>(
    `select ps.parent_id, pu.phone, cu.full_name as child
       from parents_students ps
       join users pu on pu.id = ps.parent_id
       join users cu on cu.id = ps.student_id
      where ps.student_id = $1 and pu.phone is not null`, [studentId]);

  for (const r of rows) {
    await enqueueNotification({
      recipientId: r.parent_id,
      phone: r.phone,
      templateCode: 'purchase',
      body: `Neiron Academy\n${r.child} обменял ${price} коинов на «${title}». Заберёт на ближайшем занятии.`,
      dedupeKey: `purchase:${studentId}:${title}:${Date.now()}`,
    });
  }
}
