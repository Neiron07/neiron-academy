import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query, tx } from '../db.js';
import { AppError } from '../lib/errors.js';
import { generateLogin, generatePin, hash, normalizePhone } from '../lib/auth.js';
import { applyCoins } from '../lib/coins.js';
import { audit } from '../lib/audit.js';
import { estimateNextPayment } from '../lib/payments.js';
import { config } from '../config.js';

export default async function adminRoutes(app: FastifyInstance) {
  const admin = app.auth(['admin']);

  // =================================================== ДАШБОРД
  app.get('/dashboard', { preHandler: admin }, async () => {
    const [lessonsToday, notClosed, groups, money, atRisk, pendingOrders, newLeads, totalStudents, paymentRows] =
      await Promise.all([
        one(`select count(*) filter (where status='completed')::int as completed,
                    count(*) filter (where status='planned')::int   as planned
               from lessons
              where scheduled_at::date = (now() at time zone 'Asia/Almaty')::date`),

        query(`select l.id, l.scheduled_at, g.name as group_name, u.full_name as teacher
                 from lessons l join groups g on g.id=l.group_id
            left join users u on u.id = g.teacher_id
                where l.status='planned' and l.scheduled_at < now() - interval '2 hours'
                  and l.scheduled_at > now() - interval '14 days'
                order by l.scheduled_at`),

        query(`select g.id, g.name, g.capacity, c.name as course_name,
                      (select count(*) from enrollments e where e.group_id=g.id and e.status='active') as filled
                 from groups g join courses c on c.id=g.course_id
                where g.status='active' order by g.name`),

        one(`select coalesce(sum(amount_kzt),0)::int as revenue_month,
                    count(*)::int as payments_count
               from payments
              where paid_at >= date_trunc('month', current_date)`),

        query(`select * from v_at_risk order by risk_level, last_lesson_at`),

        one(`select count(*)::int as cnt from orders o join shop_items i on i.id=o.item_id
              where o.status='pending' and i.kind <> 'virtual'`),

        one(`select count(*)::int as cnt from leads where status='new'`),

        one(`select count(*)::int as cnt from users where role='student' and is_active`),

        query(`select u.id, u.full_name, pay.last_payment_amount, pay.last_payment_at,
                      pay.lessons_left, pay.weekly_lessons
                 from users u join v_student_payment_status pay on pay.student_id = u.id
                where u.role='student' and u.is_active and pay.last_payment_at is not null`),
      ]);

    const debtors = await query(
      `select u.id, u.full_name, lb.lessons_left
         from v_lesson_balance lb join users u on u.id = lb.student_id
        where lb.lessons_left <= 2 and u.is_active
        order by lb.lessons_left`);

    // Просроченные и скоро наступающие оплаты — оценка по темпу занятий, не жёсткая дата.
    const paymentsDue = paymentRows
      .map((r: any) => {
        const estimate = estimateNextPayment(r.last_payment_at, r.lessons_left, r.weekly_lessons);
        if (!estimate) return null;
        const days = Math.round((new Date(estimate).getTime() - Date.now()) / 86_400_000);
        return { id: r.id, full_name: r.full_name, amount: r.last_payment_amount, next_payment_estimate: estimate, days };
      })
      .filter((r: any): r is NonNullable<typeof r> => !!r && r.days <= 7)
      .sort((a: any, b: any) => a.days - b.days)
      .slice(0, 20);

    return {
      lessonsToday, notClosed, groups, money, atRisk, debtors, paymentsDue,
      totalStudents: totalStudents?.cnt ?? 0,
      pendingOrders: pendingOrders?.cnt ?? 0,
      newLeads: newLeads?.cnt ?? 0,
    };
  });

  /** Отчёт по магазину: во что обходятся коины в тенге. */
  app.get('/shop-report', { preHandler: admin }, async () => {
    const issued = await query(
      `select date_trunc('month', o.created_at)::date as month,
              sum(o.price_coins)::int as coins_spent,
              sum(case when i.kind='virtual' then 0 else i.cost_kzt end)::int as cost_kzt,
              count(*)::int as orders
         from orders o join shop_items i on i.id=o.item_id
        where o.status <> 'cancelled'
        group by 1 order by 1 desc limit 12`);

    const emitted = await query(
      `select date_trunc('month', created_at)::date as month,
              sum(coins) filter (where coins > 0)::int as coins_emitted,
              sum(-coins) filter (where coins < 0)::int as coins_burned
         from coin_transactions group by 1 order by 1 desc limit 12`);

    return { issued, emitted };
  });

  // =================================================== УЧЕНИКИ
  app.post('/students', { preHandler: admin }, async (req) => {
    const body = z.object({
      full_name: z.string().min(2),
      birth_date: z.string().optional(),
      branch_id: z.string().uuid().optional(),
      group_id: z.string().uuid().optional(),
      parent: z.object({
        full_name: z.string().min(2),
        phone: z.string(),
      }).optional(),
    }).parse(req.body);

    const birthYear = body.birth_date ? new Date(body.birth_date).getFullYear() : undefined;
    const login = await generateLogin(body.full_name, birthYear);
    const pin = generatePin();

    const created = await tx(async (c) => {
      const u = await c.query(
        `insert into users (branch_id, role, full_name, login, pin_hash, created_by)
         values ($1,'student',$2,$3,$4,$5) returning id`,
        [body.branch_id ?? config.BRANCH_ID, body.full_name, login, await hash(pin), req.user!.id]);
      const studentId = u.rows[0].id;

      await c.query(`insert into students (user_id, birth_date) values ($1,$2)`,
        [studentId, body.birth_date ?? null]);

      if (body.group_id) {
        const cap = await c.query(
          `select g.capacity,
                  (select count(*) from enrollments e where e.group_id=g.id and e.status='active') as filled
             from groups g where g.id=$1`, [body.group_id]);
        if (!cap.rowCount) throw new AppError(404, 'NOT_FOUND', 'Группа не найдена');
        if (Number(cap.rows[0].filled) >= cap.rows[0].capacity) {
          throw new AppError(400, 'GROUP_FULL', 'В группе нет свободных мест');
        }
        await c.query(`insert into enrollments (group_id, student_id) values ($1,$2)`,
          [body.group_id, studentId]);
      }

      let parentId: string | null = null;
      let parentPin: string | null = null;
      if (body.parent) {
        const phone = normalizePhone(body.parent.phone);
        const existing = await c.query(`select id from users where phone=$1`, [phone]);
        if (existing.rowCount) {
          parentId = existing.rows[0].id;
        } else {
          // Родитель входит по телефону + PIN — так же, как ученик по логину + PIN.
          parentPin = generatePin();
          const p = await c.query(
            `insert into users (branch_id, role, full_name, phone, pin_hash, created_by)
             values ($1,'parent',$2,$3,$4,$5) returning id`,
            [body.branch_id ?? config.BRANCH_ID, body.parent.full_name, phone, await hash(parentPin), req.user!.id]);
          parentId = p.rows[0].id;
        }
        await c.query(
          `insert into parents_students (parent_id, student_id) values ($1,$2) on conflict do nothing`,
          [parentId, studentId]);
      }

      return { studentId, parentId, parentPin };
    });

    await audit({ actorId: req.user!.id, action: 'student.create', entity: 'users', entityId: created.studentId });

    // Логин, PIN ученика и PIN родителя показываются ОДИН раз — распечатать карточку и отдать ученику.
    return {
      student_id: created.studentId,
      parent_id: created.parentId,
      login,
      pin,
      parent_pin: created.parentPin,
    };
  });

  app.get('/students', { preHandler: admin }, async (req) => {
    const q = z.object({ search: z.string().optional(), status: z.string().optional() }).parse(req.query);
    const rows = await query(
      `select u.id, u.full_name, u.login, u.is_active, u.branch_id, u.created_at,
              b.name as branch_name,
              s.status, s.birth_date, s.coins_balance, s.xp_total,
              g.id as group_id, g.name as group_name, e.joined_at,
              pay.lessons_left, pay.weekly_lessons,
              pay.total_paid, pay.last_payment_at, pay.last_payment_amount,
              (select pu.phone from parents_students ps join users pu on pu.id=ps.parent_id
                where ps.student_id = u.id order by ps.is_primary desc limit 1) as phone,
              (select coalesce(json_agg(json_build_object('id', pu.id, 'full_name', pu.full_name, 'phone', pu.phone)), '[]')
                 from parents_students ps join users pu on pu.id=ps.parent_id
                where ps.student_id = u.id) as parents
         from users u
         join students s on s.user_id = u.id
    left join branches b on b.id = u.branch_id
    left join enrollments e on e.student_id = u.id and e.status='active'
    left join groups g on g.id = e.group_id
    left join v_student_payment_status pay on pay.student_id = u.id
        where u.role='student'
          and ($1::text is null or u.full_name ilike '%'||$1||'%' or u.login ilike '%'||$1||'%')
          and ($2::text is null or s.status = $2::enroll_status)
        order by u.full_name`,
      [q.search ?? null, q.status ?? null]);

    return rows.map((r: any) => ({
      ...r,
      next_payment_estimate: estimateNextPayment(r.last_payment_at, r.lessons_left, r.weekly_lessons),
    }));
  });

  /** Редактирование ученика: имя, дата рождения, филиал, активность. */
  app.patch('/students/:id', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      full_name: z.string().min(2).optional(),
      birth_date: z.string().nullable().optional(),
      branch_id: z.string().uuid().optional(),
      is_active: z.boolean().optional(),
    }).parse(req.body);

    const existing = await one<{ id: string }>(`select id from users where id=$1 and role='student'`, [id]);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Ученик не найден');

    await tx(async (c) => {
      if (body.full_name !== undefined || body.branch_id !== undefined || body.is_active !== undefined) {
        await c.query(
          `update users set
             full_name = coalesce($2, full_name),
             branch_id = coalesce($3, branch_id),
             is_active = coalesce($4, is_active),
             token_version = case when $4 = false then token_version + 1 else token_version end
           where id = $1`,
          [id, body.full_name ?? null, body.branch_id ?? null, body.is_active ?? null]);
      }
      if (body.birth_date !== undefined) {
        await c.query(`update students set birth_date=$2 where user_id=$1`, [id, body.birth_date]);
      }
    });

    await audit({ actorId: req.user!.id, action: 'student.update', entity: 'users', entityId: id, diff: body });
    return one(
      `select u.id, u.full_name, u.is_active, u.branch_id, s.birth_date
         from users u join students s on s.user_id=u.id where u.id=$1`, [id]);
  });

  /**
   * Удаление ученика: настоящий DELETE — только если по нему нет платежей,
   * посещаемости и истории коинов (значит, это пустая запись без активности).
   * Если история есть — предлагаем деактивировать, а не стирать её.
   */
  app.delete('/students/:id', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const existing = await one<{ id: string }>(`select id from users where id=$1 and role='student'`, [id]);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Ученик не найден');

    const activity = await one<{ has_activity: boolean }>(
      `select exists(select 1 from payments where student_id=$1)
           or exists(select 1 from attendance where student_id=$1)
           or exists(select 1 from coin_transactions where student_id=$1)
              as has_activity`, [id]);

    if (activity?.has_activity) {
      throw new AppError(409, 'HAS_HISTORY',
        'У ученика есть платежи, посещаемость или коины — удалить нельзя, чтобы не потерять историю. Деактивируйте вместо удаления.');
    }

    await query(`delete from users where id=$1`, [id]);
    await audit({ actorId: req.user!.id, action: 'student.delete', entity: 'users', entityId: id });
    return { ok: true };
  });

  /** Филиалы — для выбора при создании ученика или группы. */
  app.get('/branches', { preHandler: admin }, async () => {
    return query(`select id, name, address, is_active from branches where is_active order by name`);
  });

  /**
   * Сброс PIN — для любого пользователя, у которого он есть (ученик или родитель).
   * В отличие от /teacher/students/:id/reset-pin, не ограничен своей группой:
   * админ чинит доступ всем, если кто-то забыл PIN.
   */
  app.post('/users/:id/reset-pin', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const user = await one<{ role: string }>(`select role from users where id = $1`, [id]);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'Пользователь не найден');
    if (user.role !== 'student' && user.role !== 'parent') {
      throw new AppError(400, 'NO_PIN', 'У этой роли нет входа по PIN');
    }

    const pin = generatePin();
    await query(
      `update users set pin_hash=$2, failed_attempts=0, locked_until=null,
              token_version = token_version + 1
        where id=$1`, [id, await hash(pin)]);

    await audit({ actorId: req.user!.id, action: 'user.reset_pin', entity: 'users', entityId: id });
    return { pin };
  });

  app.post('/students/:id/enroll', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({ group_id: z.string().uuid() }).parse(req.body);

    await tx(async (c) => {
      await c.query(
        `update enrollments set status='left', left_at=current_date
          where student_id=$1 and status='active'`, [id]);
      await c.query(
        `insert into enrollments (group_id, student_id) values ($1,$2)`, [body.group_id, id]);
    });
    return { ok: true };
  });

  // =================================================== ПЕРСОНАЛ
  /**
   * Единый источник преподавателей: этот же список (и только он) используют
   * выбор преподавателя в группе и в календаре — никаких отдельных списков.
   * Отдаёт и активных, и деактивированных — фронт сам решает, где кого показывать.
   */
  app.get('/teachers', { preHandler: admin }, async () => {
    return query(
      `select u.id, u.full_name, u.phone, u.role, u.is_active, u.created_at,
              (select count(*) from groups g where g.teacher_id = u.id and g.status='active') as groups_count
         from users u
        where u.role in ('teacher','admin')
        order by u.is_active desc, u.full_name`);
  });

  /** Карточка сотрудника: сам + его группы + назначенные на него пробные/события. */
  app.get('/teachers/:id', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const teacher = await one(
      `select id, full_name, phone, role, is_active, created_at from users
        where id = $1 and role in ('teacher','admin')`, [id]);
    if (!teacher) throw new AppError(404, 'NOT_FOUND', 'Сотрудник не найден');

    const groups = await query(
      `select g.id, g.name, g.room, g.capacity, c.name as course_name,
              (select count(*) from enrollments e where e.group_id=g.id and e.status='active') as students_count
         from groups g join courses c on c.id = g.course_id
        where g.teacher_id = $1 and g.status='active'
        order by g.name`, [id]);

    const events = await query(
      `select id, kind, title, starts_at, duration_min, room, contact_name, contact_phone
         from calendar_events
        where teacher_id = $1 and starts_at > now() - interval '1 day'
        order by starts_at`, [id]);

    return { teacher, groups, events };
  });

  app.post('/teachers', { preHandler: admin }, async (req) => {
    const body = z.object({
      full_name: z.string().min(2),
      phone: z.string(),
      password: z.string().min(8),
      role: z.enum(['teacher', 'admin']).default('teacher'),
    }).parse(req.body);

    const created = await one(
      `insert into users (branch_id, role, full_name, phone, password_hash, created_by)
       values ($1,$2,$3,$4,$5,$6) returning id, full_name, phone, role, is_active, created_at`,
      [config.BRANCH_ID, body.role, body.full_name, normalizePhone(body.phone),
       await hash(body.password), req.user!.id]);

    await audit({ actorId: req.user!.id, action: 'staff.create', entity: 'users', entityId: created!.id });
    return created;
  });

  /**
   * Редактирование сотрудника: имя/телефон/роль, деактивация/восстановление,
   * необязательный сброс пароля. Хард-делит не делаем — на преподавателя могут
   * ссылаться группы и история, а живых занятий это не должно ломать.
   */
  app.patch('/teachers/:id', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      full_name: z.string().min(2).optional(),
      phone: z.string().optional(),
      role: z.enum(['teacher', 'admin']).optional(),
      is_active: z.boolean().optional(),
      password: z.string().min(8).optional(),
    }).parse(req.body);

    const existing = await one<{ id: string }>(
      `select id from users where id = $1 and role in ('teacher','admin')`, [id]);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Сотрудник не найден');

    const passwordHash = body.password ? await hash(body.password) : null;

    const updated = await one(
      `update users set
         full_name = coalesce($2, full_name),
         phone = coalesce($3, phone),
         role = coalesce($4, role)::user_role,
         is_active = coalesce($5, is_active),
         password_hash = coalesce($6, password_hash),
         token_version = case when $5 = false or $6 is not null then token_version + 1 else token_version end
       where id = $1
       returning id, full_name, phone, role, is_active, created_at`,
      [id, body.full_name ?? null, body.phone ? normalizePhone(body.phone) : null, body.role ?? null,
       body.is_active ?? null, passwordHash]);

    await audit({ actorId: req.user!.id, action: 'staff.update', entity: 'users', entityId: id, diff: { ...body, password: body.password ? '***' : undefined } });
    return updated;
  });

  // =================================================== ГРУППЫ
  app.post('/groups', { preHandler: admin }, async (req) => {
    const body = z.object({
      course_id: z.string().uuid(),
      teacher_id: z.string().uuid().optional(),
      branch_id: z.string().uuid().optional(),
      name: z.string().min(2),
      room: z.string().optional(),
      capacity: z.number().int().min(1).max(30).default(6),
      schedule: z.array(z.object({
        weekday: z.number().int().min(1).max(7),
        start_time: z.string().regex(/^\d{2}:\d{2}$/),
        duration_min: z.number().int().default(90),
      })).default([]),
    }).parse(req.body);

    return tx(async (c) => {
      const g = await c.query(
        `insert into groups (branch_id, course_id, teacher_id, name, room, capacity)
         values ($1,$2,$3,$4,$5,$6) returning *`,
        [body.branch_id ?? config.BRANCH_ID, body.course_id, body.teacher_id ?? null, body.name,
         body.room ?? null, body.capacity]);

      for (const s of body.schedule) {
        await c.query(
          `insert into group_schedule (group_id, weekday, start_time, duration_min)
           values ($1,$2,$3,$4)`, [g.rows[0].id, s.weekday, s.start_time, s.duration_min]);
      }
      // Сразу раскатываем расписание на 2 недели вперёд.
      await c.query(`select generate_lessons(14)`);
      return g.rows[0];
    });
  });

  /** Редактирование группы: имя, кабинет, вместимость, преподаватель, филиал, статус. */
  app.patch('/groups/:id', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      name: z.string().min(2).optional(),
      room: z.string().nullable().optional(),
      capacity: z.number().int().min(1).max(30).optional(),
      teacher_id: z.string().uuid().nullable().optional(),
      branch_id: z.string().uuid().optional(),
      status: z.enum(['active', 'archived']).optional(),
    }).parse(req.body);

    const existing = await one<{ id: string }>(`select id from groups where id=$1`, [id]);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Группа не найдена');

    const updated = await one(
      `update groups set
         name = coalesce($2, name),
         room = coalesce($3, room),
         capacity = coalesce($4, capacity),
         teacher_id = coalesce($5, teacher_id),
         branch_id = coalesce($6, branch_id),
         status = coalesce($7, status)::group_status
       where id = $1 returning *`,
      [id, body.name ?? null, body.room ?? null, body.capacity ?? null,
       body.teacher_id ?? null, body.branch_id ?? null, body.status ?? null]);

    await audit({ actorId: req.user!.id, action: 'group.update', entity: 'groups', entityId: id, diff: body });
    return updated;
  });

  /**
   * Удаление группы: настоящий DELETE — только если у группы никогда не было
   * уроков (пустая, ничего не потеряется). Иначе архивируем: она пропадает
   * из активных списков, а история учеников остаётся целой.
   */
  app.delete('/groups/:id', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const existing = await one<{ id: string }>(`select id from groups where id=$1`, [id]);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Группа не найдена');

    const hasLessons = await one(`select 1 from lessons where group_id=$1 limit 1`, [id]);
    if (hasLessons) {
      await query(`update groups set status='archived' where id=$1`, [id]);
      await audit({ actorId: req.user!.id, action: 'group.archive', entity: 'groups', entityId: id });
      return { ok: true, archived: true };
    }

    await query(`delete from groups where id=$1`, [id]);
    await audit({ actorId: req.user!.id, action: 'group.delete', entity: 'groups', entityId: id });
    return { ok: true, archived: false };
  });

  // =================================================== ОПЛАТЫ
  app.post('/payments', { preHandler: admin }, async (req) => {
    const body = z.object({
      student_id: z.string().uuid(),
      amount_kzt: z.number().int().positive(),
      lessons_count: z.number().int().positive(),
      method: z.enum(['kaspi', 'cash', 'transfer']).default('kaspi'),
      paid_at: z.string().optional(),
      period_label: z.string().optional(),
      comment: z.string().optional(),
    }).parse(req.body);

    const p = await one(
      `insert into payments (student_id, amount_kzt, lessons_count, method, paid_at, period_label, comment, created_by)
       values ($1,$2,$3,$4,coalesce($5::date, current_date),$6,$7,$8) returning *`,
      [body.student_id, body.amount_kzt, body.lessons_count, body.method,
       body.paid_at ?? null, body.period_label ?? null, body.comment ?? null, req.user!.id]);

    await audit({ actorId: req.user!.id, action: 'payment.create', entity: 'payments', diff: body });
    return p;
  });

  app.get('/payments', { preHandler: admin }, async (req) => {
    const q = z.object({ month: z.string().optional() }).parse(req.query);
    return query(
      `select p.*, u.full_name as student_name
         from payments p join users u on u.id = p.student_id
        where ($1::text is null or to_char(p.paid_at,'YYYY-MM') = $1)
        order by p.paid_at desc limit 500`, [q.month ?? null]);
  });

  // =================================================== КОИНЫ
  /** Корректировка баланса — только компенсирующей транзакцией, не правкой. */
  app.post('/coins/adjust', { preHandler: admin }, async (req) => {
    const body = z.object({
      student_id: z.string().uuid(),
      coins: z.number().int(),
      reason: z.string().min(3),
    }).parse(req.body);

    const result = await applyCoins({
      studentId: body.student_id,
      coins: body.coins,
      xp: 0,
      reasonCode: 'adjust',
      reasonText: body.reason,
      actorId: req.user!.id,
      idempotencyKey: `adj:${body.student_id}:${Date.now()}`,
    });

    await audit({ actorId: req.user!.id, action: 'coins.adjust', entity: 'students',
      entityId: body.student_id, diff: body });
    return result;
  });

  // =================================================== МАГАЗИН
  app.post('/shop-items', { preHandler: admin }, async (req) => {
    const body = z.object({
      title: z.string().min(2),
      description: z.string().optional(),
      image_url: z.string().url().optional(),
      kind: z.enum(['physical', 'virtual', 'privilege']).default('physical'),
      price_coins: z.number().int().positive(),
      cost_kzt: z.number().int().min(0).default(0),
      stock: z.number().int().min(0).nullable().default(null),
    }).parse(req.body);

    return one(
      `insert into shop_items (branch_id, title, description, image_url, kind, price_coins, cost_kzt, stock)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [config.BRANCH_ID, body.title, body.description ?? null, body.image_url ?? null,
       body.kind, body.price_coins, body.cost_kzt, body.stock]);
  });

  // =================================================== ЛИДЫ
  app.get('/leads', { preHandler: admin }, async (req) => {
    const q = z.object({ status: z.string().optional() }).parse(req.query);
    return query(
      `select * from leads where ($1::text is null or status = $1::lead_status)
        order by created_at desc limit 200`, [q.status ?? null]);
  });

  app.patch('/leads/:id', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      status: z.enum(['new', 'contacted', 'trial', 'won', 'lost']),
      comment: z.string().optional(),
    }).parse(req.body);
    return one(
      `update leads set status=$2, comment=coalesce($3, comment) where id=$1 returning *`,
      [id, body.status, body.comment ?? null]);
  });

  // =================================================== КАЛЕНДАРЬ
  /**
   * Реальные уроки (из lessons, с именем преподавателя) + пробные/события
   * (из calendar_events) одним запросом на период — для сетки календаря.
   */
  app.get('/calendar', { preHandler: admin }, async (req) => {
    const q = z.object({ from: z.string(), to: z.string() }).parse(req.query);

    const lessons = await query(
      `select l.id, l.scheduled_at, l.duration_min, l.status,
              g.id as group_id, g.name as group_name, g.room,
              c.name as course_name,
              u.full_name as teacher_name
         from lessons l
         join groups g on g.id = l.group_id
         join courses c on c.id = g.course_id
    left join users u on u.id = g.teacher_id
        where l.scheduled_at::date between $1 and $2
        order by l.scheduled_at`,
      [q.from, q.to]);

    const events = await query(
      `select e.id, e.kind, e.title, e.description, e.starts_at, e.duration_min,
              e.room, e.contact_name, e.contact_phone, e.lead_id,
              e.teacher_id, u.full_name as teacher_name
         from calendar_events e
    left join users u on u.id = e.teacher_id
        where e.starts_at::date between $1 and $2
        order by e.starts_at`,
      [q.from, q.to]);

    return { lessons, events };
  });

  app.post('/calendar/events', { preHandler: admin }, async (req) => {
    const body = z.object({
      kind: z.enum(['trial', 'event']).default('trial'),
      title: z.string().min(2).max(200),
      description: z.string().max(2000).optional(),
      starts_at: z.string().datetime(),
      duration_min: z.number().int().positive().default(60),
      teacher_id: z.string().uuid().optional(),
      room: z.string().optional(),
      contact_name: z.string().optional(),
      contact_phone: z.string().optional(),
      lead_id: z.string().uuid().optional(),
    }).parse(req.body);

    const created = await one(
      `insert into calendar_events
         (branch_id, kind, title, description, starts_at, duration_min,
          teacher_id, room, contact_name, contact_phone, lead_id, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *`,
      [config.BRANCH_ID, body.kind, body.title, body.description ?? null, body.starts_at,
       body.duration_min, body.teacher_id ?? null, body.room ?? null,
       body.contact_name ?? null, body.contact_phone ? normalizePhone(body.contact_phone) : null,
       body.lead_id ?? null, req.user!.id]);

    await audit({ actorId: req.user!.id, action: 'calendar_event.create', entity: 'calendar_events', entityId: created.id });
    return created;
  });

  app.patch('/calendar/events/:id', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      kind: z.enum(['trial', 'event']).optional(),
      title: z.string().min(2).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      starts_at: z.string().datetime().optional(),
      duration_min: z.number().int().positive().optional(),
      teacher_id: z.string().uuid().nullable().optional(),
      room: z.string().nullable().optional(),
      contact_name: z.string().nullable().optional(),
      contact_phone: z.string().nullable().optional(),
    }).parse(req.body);

    const existing = await one(`select id from calendar_events where id = $1`, [id]);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Событие не найдено');

    const updated = await one(
      `update calendar_events set
         kind = coalesce($2, kind),
         title = coalesce($3, title),
         description = coalesce($4, description),
         starts_at = coalesce($5, starts_at),
         duration_min = coalesce($6, duration_min),
         teacher_id = coalesce($7, teacher_id),
         room = coalesce($8, room),
         contact_name = coalesce($9, contact_name),
         contact_phone = coalesce($10, contact_phone)
       where id = $1 returning *`,
      [id, body.kind ?? null, body.title ?? null, body.description ?? null, body.starts_at ?? null,
       body.duration_min ?? null, body.teacher_id ?? null, body.room ?? null,
       body.contact_name ?? null, body.contact_phone ? normalizePhone(body.contact_phone) : null]);

    await audit({ actorId: req.user!.id, action: 'calendar_event.update', entity: 'calendar_events', entityId: id, diff: body });
    return updated;
  });

  app.delete('/calendar/events/:id', { preHandler: admin }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const deleted = await one(`delete from calendar_events where id = $1 returning id`, [id]);
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Событие не найдено');
    await audit({ actorId: req.user!.id, action: 'calendar_event.delete', entity: 'calendar_events', entityId: id });
    return { ok: true };
  });
}
