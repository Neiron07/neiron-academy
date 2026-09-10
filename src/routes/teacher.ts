import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query } from '../db.js';
import { AppError } from '../lib/errors.js';
import { generatePin, hash } from '../lib/auth.js';
import { audit } from '../lib/audit.js';

export default async function teacherRoutes(app: FastifyInstance) {
  const staff = app.auth(['teacher', 'admin']);

  /** Главный экран: уроки на сегодня. Если сегодня нет — неделя вперёд. */
  app.get('/today', { preHandler: staff }, async (req) => {
    const isAdmin = req.user!.role === 'admin';

    const today = await query(
      `select l.id, l.scheduled_at, l.status, l.duration_min,
              g.id as group_id, g.name as group_name, g.room,
              c.name as course_name,
              t.title as planned_topic,
              (select count(*) from enrollments e where e.group_id = g.id and e.status='active') as students_count,
              (select count(*) from attendance a where a.lesson_id = l.id) as marked_count
         from lessons l
         join groups g on g.id = l.group_id
         join courses c on c.id = g.course_id
         left join topics t on t.id = coalesce(l.topic_id, g.current_topic_id)
        where l.scheduled_at::date = (now() at time zone 'Asia/Almaty')::date
          and l.status <> 'cancelled'
          and ($1 or g.teacher_id = $2)
        order by l.scheduled_at`,
      [isAdmin, req.user!.id]);

    // Незакрытые уроки прошлых дней — «красная зона», висит до заполнения.
    const overdue = await query(
      `select l.id, l.scheduled_at, g.name as group_name
         from lessons l join groups g on g.id = l.group_id
        where l.status = 'planned'
          and l.scheduled_at < now() - interval '2 hours'
          and l.scheduled_at > now() - interval '14 days'
          and ($1 or g.teacher_id = $2)
        order by l.scheduled_at`,
      [isAdmin, req.user!.id]);

    const upcoming = today.length === 0
      ? await query(
          `select l.id, l.scheduled_at, g.name as group_name, c.name as course_name
             from lessons l join groups g on g.id = l.group_id join courses c on c.id = g.course_id
            where l.scheduled_at > now() and l.status = 'planned'
              and ($1 or g.teacher_id = $2)
            order by l.scheduled_at limit 10`, [isAdmin, req.user!.id])
      : [];

    // Пробные уроки и события — админ мог назначить их именно на этого преподавателя.
    const events = await query(
      `select id, kind, title, starts_at, duration_min, room, contact_name, contact_phone
         from calendar_events
        where starts_at::date = (now() at time zone 'Asia/Almaty')::date
          and ($1 or teacher_id = $2)
        order by starts_at`,
      [isAdmin, req.user!.id]);

    return { today, overdue, upcoming, events };
  });

  /** Расписание преподавателя на период. */
  app.get('/schedule', { preHandler: staff }, async (req) => {
    const q = z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }).parse(req.query);

    const from = q.from ?? new Date().toISOString().slice(0, 10);
    const to = q.to ?? new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
    const isAdmin = req.user!.role === 'admin';

    const lessons = await query(
      `select l.id, l.scheduled_at, l.status, g.name as group_name, g.room, c.name as course_name
         from lessons l join groups g on g.id = l.group_id join courses c on c.id = g.course_id
        where l.scheduled_at::date between $1 and $2
          and ($3 or g.teacher_id = $4)
        order by l.scheduled_at`,
      [from, to, isAdmin, req.user!.id]);

    const events = await query(
      `select id, kind, title, starts_at, duration_min, room, contact_name, contact_phone
         from calendar_events
        where starts_at::date between $1 and $2
          and ($3 or teacher_id = $4)
        order by starts_at`,
      [from, to, isAdmin, req.user!.id]);

    return { lessons, events };
  });

  /** Мои группы. Админ с ?status=all видит и архивные (для управления). */
  app.get('/groups', { preHandler: staff }, async (req) => {
    const q = z.object({ status: z.string().optional() }).parse(req.query);
    const includeArchived = req.user!.role === 'admin' && q.status === 'all';
    return query(
      `select g.id, g.name, g.room, g.capacity, g.status, c.name as course_name,
              t.title as current_topic, b.name as branch_name, g.teacher_id,
              (select count(*) from enrollments e where e.group_id=g.id and e.status='active') as students_count
         from groups g
         join courses c on c.id = g.course_id
    left join topics t on t.id = g.current_topic_id
    left join branches b on b.id = g.branch_id
        where ($3 or g.status = 'active') and ($1 or g.teacher_id = $2)
        order by g.status, g.name`,
      [req.user!.role === 'admin', req.user!.id, includeArchived]);
  });

  /** Карточка группы: состав, посещаемость, прогресс. */
  app.get('/groups/:id', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const group = await one<{ teacher_id: string }>(
      `select g.*, c.name as course_name from groups g join courses c on c.id=g.course_id where g.id=$1`, [id]);
    if (!group) throw new AppError(404, 'NOT_FOUND', 'Группа не найдена');
    if (req.user!.role === 'teacher' && group.teacher_id !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Это не ваша группа');
    }

    const students = await query(
      `select u.id, u.full_name, u.login, s.coins_balance, s.xp_total,
              round(100.0 * count(*) filter (where a.status in ('present','late'))
                    / nullif(count(a.id), 0)) as attendance_pct,
              count(a.id) as lessons_attended
         from enrollments e
         join users u on u.id = e.student_id
         join students s on s.user_id = u.id
         left join attendance a on a.student_id = u.id
         left join lessons l on l.id = a.lesson_id and l.group_id = e.group_id
        where e.group_id = $1 and e.status='active'
        group by u.id, u.full_name, u.login, s.coins_balance, s.xp_total
        order by u.full_name`, [id]);

    const recentLessons = await query(
      `select l.id, l.scheduled_at, l.status, t.title as topic
         from lessons l left join topics t on t.id = l.topic_id
        where l.group_id = $1 and l.scheduled_at < now()
        order by l.scheduled_at desc limit 10`, [id]);

    const upcomingLessons = await query(
      `select l.id, l.scheduled_at, l.status
         from lessons l
        where l.group_id = $1 and l.scheduled_at >= now()
        order by l.scheduled_at limit 10`, [id]);

    const schedule = await query(
      `select id, weekday, start_time, duration_min from group_schedule
        where group_id = $1 order by weekday, start_time`, [id]);

    return { group, students, recentLessons, upcomingLessons, schedule };
  });

  /** Заказы магазина к выдаче. */
  app.get('/orders/pending', { preHandler: staff }, async (req) => {
    return query(
      `select o.id, o.created_at, o.price_coins,
              u.full_name as student_name, g.name as group_name,
              i.title as item_title, i.kind
         from orders o
         join users u on u.id = o.student_id
         join shop_items i on i.id = o.item_id
         left join enrollments e on e.student_id = o.student_id and e.status='active'
         left join groups g on g.id = e.group_id
        where o.status = 'pending'
          and i.kind <> 'virtual'
          and ($1 or g.teacher_id = $2)
        order by o.created_at`,
      [req.user!.role === 'admin', req.user!.id]);
  });

  app.post('/orders/:id/issue', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const updated = await one(
      `update orders set status='issued', issued_at=now(), issued_by=$2
        where id=$1 and status='pending' returning *`, [id, req.user!.id]);
    if (!updated) throw new AppError(400, 'NOT_PENDING', 'Заказ уже выдан или отменён');
    await audit({ actorId: req.user!.id, action: 'order.issue', entity: 'orders', entityId: id });
    return { ok: true };
  });

  /** Сброс PIN ученика — препод делает это на месте, без админа. */
  app.post('/students/:id/reset-pin', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    if (req.user!.role === 'teacher') {
      const own = await one(
        `select 1 from enrollments e join groups g on g.id = e.group_id
          where e.student_id = $1 and e.status='active' and g.teacher_id = $2`,
        [id, req.user!.id]);
      if (!own) throw new AppError(403, 'FORBIDDEN', 'Этот ученик не из вашей группы');
    }

    const pin = generatePin();
    await query(
      `update users set pin_hash=$2, failed_attempts=0, locked_until=null,
              token_version = token_version + 1
        where id=$1 and role='student'`, [id, await hash(pin)]);

    await audit({ actorId: req.user!.id, action: 'student.reset_pin', entity: 'users', entityId: id });
    return { pin };   // показывается один раз, дальше только сброс
  });
}
