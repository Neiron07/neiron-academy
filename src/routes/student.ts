import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query } from '../db.js';
import { levelFromXp } from '../lib/rules.js';
import { AppError } from '../lib/errors.js';

export default async function studentRoutes(app: FastifyInstance) {
  const student = app.auth(['student']);

  /** Главный экран кабинета: маскот, коины, ачивки, ближайший урок. */
  app.get('/profile', { preHandler: student }, async (req) => {
    const id = req.user!.id;

    const s = await one<{ coins_balance: number; xp_total: number; equipped: any }>(
      `select coins_balance, xp_total, equipped from students where user_id = $1`, [id]);
    if (!s) throw new AppError(404, 'NOT_FOUND', 'Профиль не найден');

    const group = await one(
      `select g.id, g.name, c.name as course_name, t.title as current_topic
         from enrollments e
         join groups g on g.id = e.group_id
         join courses c on c.id = g.course_id
         left join topics t on t.id = g.current_topic_id
        where e.student_id = $1 and e.status='active' limit 1`, [id]);

    const achievements = await query(
      `select a.code, a.title, a.description, a.tier, a.icon, sa.earned_at
         from student_achievements sa join achievements a on a.code = sa.code
        where sa.student_id = $1 order by sa.earned_at desc`, [id]);

    const locked = await query(
      `select code, title, description, tier, icon
         from achievements
        where is_hidden = false
          and code not in (select code from student_achievements where student_id = $1)
        order by sort_order`, [id]);

    const nextLesson = await one(
      `select l.id, l.scheduled_at, g.name as group_name
         from lessons l join groups g on g.id = l.group_id
         join enrollments e on e.group_id = g.id and e.status='active'
        where e.student_id = $1 and l.scheduled_at > now() and l.status='planned'
        order by l.scheduled_at limit 1`, [id]);

    const pendingHomework = await one<{ cnt: string }>(
      `select count(*)::text as cnt
         from homeworks h
         join enrollments e on e.group_id = h.group_id and e.status='active'
    left join submissions sub on sub.homework_id = h.id and sub.student_id = e.student_id
        where e.student_id = $1
          and (sub.id is null or sub.status = 'rework')`, [id]);

    return {
      name: req.user!.full_name,
      coins: s.coins_balance,
      mascot: levelFromXp(s.xp_total),
      equipped: s.equipped,
      group,
      achievements,
      locked,
      nextLesson,
      pendingHomeworkCount: Number(pendingHomework?.cnt ?? 0),
    };
  });

  /** История коинов — прозрачность спасает от споров «а куда делись». */
  app.get('/transactions', { preHandler: student }, async (req) => {
    const q = z.object({ limit: z.coerce.number().min(1).max(100).default(50) }).parse(req.query);
    return query(
      `select id, coins, xp, reason_code, reason_text, created_at
         from coin_transactions where student_id = $1
        order by created_at desc limit $2`, [req.user!.id, q.limit]);
  });

  /** Рейтинг внутри своей группы. Сумму коинов других детей НЕ показываем. */
  app.get('/rating', { preHandler: student }, async (req) => {
    const id = req.user!.id;
    const group = await one<{ group_id: string }>(
      `select group_id from enrollments where student_id = $1 and status='active' limit 1`, [id]);
    if (!group) return { group: null, rows: [] };

    const monthStart = `date_trunc('month', now() at time zone 'Asia/Almaty')`;

    const rows = await query(
      `select u.id,
              u.full_name,
              s.xp_total,
              coalesce(m.month_xp, 0) as month_xp,
              (u.id = $2) as is_me,
              rank() over (order by coalesce(m.month_xp,0) desc, s.xp_total desc) as position
         from enrollments e
         join users u on u.id = e.student_id
         join students s on s.user_id = u.id
         left join (
           select student_id, sum(xp) as month_xp
             from coin_transactions
            where created_at >= ${monthStart}
            group by student_id
         ) m on m.student_id = u.id
        where e.group_id = $1 and e.status='active' and u.is_active
        order by position`,
      [group.group_id, id]);

    return {
      group: group.group_id,
      season: new Date().toISOString().slice(0, 7),
      rows: rows.map((r: any) => ({
        position: Number(r.position),
        full_name: r.full_name,
        month_xp: Number(r.month_xp),
        level: levelFromXp(r.xp_total).level,
        is_me: r.is_me,
      })),
    };
  });

  /** Расписание ученика. */
  app.get('/schedule', { preHandler: student }, async (req) => {
    return query(
      `select l.id, l.scheduled_at, l.status, g.name as group_name, g.room, t.title as topic
         from lessons l
         join groups g on g.id = l.group_id
         join enrollments e on e.group_id = g.id and e.status='active'
    left join topics t on t.id = coalesce(l.topic_id, g.current_topic_id)
        where e.student_id = $1
          and l.scheduled_at between now() - interval '7 days' and now() + interval '21 days'
        order by l.scheduled_at`, [req.user!.id]);
  });

  /** Инвентарь и надевание виртуальных предметов. */
  app.get('/inventory', { preHandler: student }, async (req) => {
    return query(
      `select i.id, i.title, i.kind, i.image_url, inv.acquired_at
         from student_inventory inv join shop_items i on i.id = inv.item_id
        where inv.student_id = $1 order by inv.acquired_at desc`, [req.user!.id]);
  });

  app.post('/equip', { preHandler: student }, async (req) => {
    const body = z.object({
      slot: z.enum(['frame', 'skin', 'title', 'theme']),
      item_id: z.string().uuid().nullable(),
    }).parse(req.body);

    if (body.item_id) {
      const owned = await one(
        `select 1 from student_inventory where student_id=$1 and item_id=$2`,
        [req.user!.id, body.item_id]);
      if (!owned) throw new AppError(400, 'NOT_OWNED', 'У тебя нет этого предмета');
    }

    await query(
      `update students set equipped = jsonb_set(equipped, $2, $3::jsonb, true) where user_id = $1`,
      [req.user!.id, `{${body.slot}}`, JSON.stringify(body.item_id)]);

    return { ok: true };
  });
}
