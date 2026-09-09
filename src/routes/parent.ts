import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query } from '../db.js';
import { AppError } from '../lib/errors.js';
import { levelFromXp, LOW_BALANCE_THRESHOLD } from '../lib/rules.js';

/**
 * Родитель видит ТОЛЬКО своих детей. Проверка идёт запросом к parents_students
 * на каждый вызов — не полагаемся на то, что фронт подставит правильный id.
 */
async function assertChild(parentId: string, childId: string) {
  const link = await one(
    `select 1 from parents_students where parent_id = $1 and student_id = $2`,
    [parentId, childId]);
  if (!link) throw new AppError(403, 'FORBIDDEN', 'Нет доступа к этому ученику');
}

export default async function parentRoutes(app: FastifyInstance) {
  const parent = app.auth(['parent']);

  app.get('/children', { preHandler: parent }, async (req) => {
    return query(
      `select u.id, u.full_name, s.coins_balance, s.xp_total,
              g.name as group_name, c.name as course_name,
              lb.lessons_left
         from parents_students ps
         join users u on u.id = ps.student_id
         join students s on s.user_id = u.id
    left join enrollments e on e.student_id = u.id and e.status='active'
    left join groups g on g.id = e.group_id
    left join courses c on c.id = g.course_id
    left join v_lesson_balance lb on lb.student_id = u.id
        where ps.parent_id = $1 and u.is_active
        order by u.full_name`, [req.user!.id]);
  });

  /** Сводка по ребёнку — то, что родитель открывает чаще всего. */
  app.get('/children/:id/overview', { preHandler: parent }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await assertChild(req.user!.id, id);

    const child = await one<{ full_name: string; xp_total: number; coins_balance: number }>(
      `select u.full_name, s.xp_total, s.coins_balance
         from users u join students s on s.user_id = u.id where u.id = $1`, [id]);

    const attendance = await one<{ total: string; attended: string; pct: string }>(
      `select count(*)::text as total,
              count(*) filter (where a.status in ('present','late'))::text as attended,
              coalesce(round(100.0 * count(*) filter (where a.status in ('present','late'))
                       / nullif(count(*),0)), 0)::text as pct
         from attendance a join lessons l on l.id = a.lesson_id
        where a.student_id = $1 and l.status = 'completed'`, [id]);

    const balance = await one<{ lessons_paid: number; lessons_used: number; lessons_left: number }>(
      `select * from v_lesson_balance where student_id = $1`, [id]);

    const achievements = await query(
      `select a.title, a.icon, a.tier, sa.earned_at
         from student_achievements sa join achievements a on a.code = sa.code
        where sa.student_id = $1 order by sa.earned_at desc limit 12`, [id]);

    const topics = await query(
      `select distinct t.title, max(l.scheduled_at) as last_at
         from attendance a
         join lessons l on l.id = a.lesson_id
         join topics t on t.id = l.topic_id
        where a.student_id = $1 and l.status='completed' and a.status in ('present','late')
        group by t.title order by last_at desc limit 15`, [id]);

    return {
      child: { id, full_name: child?.full_name },
      progress: levelFromXp(child?.xp_total ?? 0),
      coins: child?.coins_balance ?? 0,
      attendance: {
        total: Number(attendance?.total ?? 0),
        attended: Number(attendance?.attended ?? 0),
        percent: Number(attendance?.pct ?? 0),
      },
      subscription: {
        ...balance,
        low: (balance?.lessons_left ?? 0) <= LOW_BALANCE_THRESHOLD,
      },
      achievements,
      topicsCovered: topics,
    };
  });

  /** Календарь посещаемости. Отменённые школой уроки помечены отдельно. */
  app.get('/children/:id/attendance', { preHandler: parent }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await assertChild(req.user!.id, id);

    return query(
      `select l.id, l.scheduled_at, l.status as lesson_status,
              l.cancelled_by_school, l.cancel_reason,
              a.status as attendance_status,
              t.title as topic, g.name as group_name
         from lessons l
         join groups g on g.id = l.group_id
         join enrollments e on e.group_id = g.id and e.student_id = $1
    left join attendance a on a.lesson_id = l.id and a.student_id = $1
    left join topics t on t.id = l.topic_id
        where l.scheduled_at >= coalesce(e.joined_at, current_date - 365)
          and l.scheduled_at <= now() + interval '14 days'
        order by l.scheduled_at desc`, [id]);
  });

  /** Обратная связь от преподавателя. */
  app.get('/children/:id/feedback', { preHandler: parent }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await assertChild(req.user!.id, id);

    return query(
      `select f.id, f.kind, f.text, f.created_at, l.scheduled_at, u.full_name as teacher_name
         from lesson_feedback f
         join lessons l on l.id = f.lesson_id
    left join users u on u.id = f.created_by
        where (f.student_id = $1
               or (f.kind = 'group_note'
                   and l.group_id in (select group_id from enrollments where student_id = $1)))
        order by f.created_at desc limit 50`, [id]);
  });

  /** Домашки и вердикты. Комментарии к другим детям не видны. */
  app.get('/children/:id/homework', { preHandler: parent }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await assertChild(req.user!.id, id);

    return query(
      `select h.id, h.title, h.description, h.deadline_at,
              sub.status, sub.feedback, sub.submitted_at
         from homeworks h
         join enrollments e on e.group_id = h.group_id and e.student_id = $1
    left join submissions sub on sub.homework_id = h.id and sub.student_id = $1
        order by h.created_at desc limit 50`, [id]);
  });

  /** История оплат и остаток абонемента. */
  app.get('/children/:id/payments', { preHandler: parent }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await assertChild(req.user!.id, id);

    const payments = await query(
      `select id, amount_kzt, lessons_count, method, paid_at, period_label, comment
         from payments where student_id = $1 order by paid_at desc`, [id]);
    const balance = await one(`select * from v_lesson_balance where student_id = $1`, [id]);

    return { payments, balance };
  });

  app.get('/children/:id/schedule', { preHandler: parent }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await assertChild(req.user!.id, id);

    return query(
      `select l.id, l.scheduled_at, l.status, g.name as group_name, g.room
         from lessons l
         join enrollments e on e.group_id = l.group_id and e.status='active'
         join groups g on g.id = l.group_id
        where e.student_id = $1 and l.scheduled_at > now() - interval '1 day'
        order by l.scheduled_at limit 30`, [id]);
  });
}
