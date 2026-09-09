import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query } from '../db.js';
import { AppError } from '../lib/errors.js';
import { applyCoins } from '../lib/coins.js';
import { evaluateAchievements } from '../lib/achievements.js';
import { COIN_RULES } from '../lib/rules.js';

export default async function homeworkRoutes(app: FastifyInstance) {
  const staff = app.auth(['teacher', 'admin']);

  // ------------------------------------------- препод: создать задание
  app.post('/', { preHandler: staff }, async (req) => {
    const body = z.object({
      group_id: z.string().uuid(),
      topic_id: z.string().uuid().optional(),
      title: z.string().min(3).max(200),
      description: z.string().max(5000).optional(),
      link: z.string().url().optional(),
      attachments: z.array(z.object({ name: z.string(), url: z.string().url() })).default([]),
      deadline_at: z.string().datetime().optional(),
    }).parse(req.body);

    if (req.user!.role === 'teacher') {
      const own = await one(`select 1 from groups where id=$1 and teacher_id=$2`,
        [body.group_id, req.user!.id]);
      if (!own) throw new AppError(403, 'FORBIDDEN', 'Это не ваша группа');
    }

    return one(
      `insert into homeworks (group_id, topic_id, title, description, link, attachments, deadline_at, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [body.group_id, body.topic_id ?? null, body.title, body.description ?? null,
       body.link ?? null, JSON.stringify(body.attachments), body.deadline_at ?? null, req.user!.id]);
  });

  // ------------------------------------ препод: список сдач по заданию
  app.get('/:id/submissions', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const hw = await one<{ group_id: string; teacher_id: string; title: string; deadline_at: string }>(
      `select h.*, g.teacher_id from homeworks h join groups g on g.id=h.group_id where h.id=$1`, [id]);
    if (!hw) throw new AppError(404, 'NOT_FOUND', 'Задание не найдено');
    if (req.user!.role === 'teacher' && hw.teacher_id !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Это не ваша группа');
    }

    const rows = await query(
      `select u.id as student_id, u.full_name,
              sub.id as submission_id, sub.content, sub.attachments,
              sub.submitted_at, sub.status, sub.feedback, sub.was_on_time
         from enrollments e
         join users u on u.id = e.student_id
    left join submissions sub on sub.homework_id = $1 and sub.student_id = u.id
        where e.group_id = $2 and e.status='active'
        order by (sub.id is null), u.full_name`, [id, hw.group_id]);

    return { homework: hw, submissions: rows };
  });

  // --------------------------------------------- препод: проверить
  app.post('/submissions/:id/review', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      status: z.enum(['accepted', 'excellent', 'rework']),
      feedback: z.string().max(2000).optional(),
    }).parse(req.body);

    const sub = await one<{
      id: string; student_id: string; homework_id: string;
      was_on_time: boolean; status: string; teacher_id: string;
    }>(
      `select sub.*, g.teacher_id
         from submissions sub
         join homeworks h on h.id = sub.homework_id
         join groups g on g.id = h.group_id
        where sub.id = $1`, [id]);
    if (!sub) throw new AppError(404, 'NOT_FOUND', 'Работа не найдена');
    if (req.user!.role === 'teacher' && sub.teacher_id !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Это не ваша группа');
    }

    await query(
      `update submissions set status=$2, feedback=$3, reviewed_at=now(), reviewed_by=$4 where id=$1`,
      [id, body.status, body.feedback ?? null, req.user!.id]);

    // Начисляем один раз за работу — ключ идемпотентности на submission_id.
    if (body.status === 'accepted' || body.status === 'excellent') {
      const base = sub.was_on_time ? COIN_RULES.homework_on_time : COIN_RULES.homework_late;
      await applyCoins({
        studentId: sub.student_id,
        coins: base.coins,
        xp: base.xp,
        reasonCode: 'homework',
        reasonText: sub.was_on_time ? 'Домашка сдана в срок' : 'Домашка принята (после дедлайна)',
        actorId: req.user!.id,
        idempotencyKey: `hw:${sub.id}`,
      });

      if (body.status === 'excellent') {
        await applyCoins({
          studentId: sub.student_id,
          coins: COIN_RULES.homework_excellent.coins,
          xp: COIN_RULES.homework_excellent.xp,
          reasonCode: 'homework_excellent',
          reasonText: 'Домашка на «отлично»',
          actorId: req.user!.id,
          idempotencyKey: `hwx:${sub.id}`,
        });
      }
      await evaluateAchievements(sub.student_id);
    }

    return { ok: true };
  });

  // ------------------------------------------ ученик: мои домашки
  app.get('/my', { preHandler: app.auth(['student']) }, async (req) => {
    return query(
      `select h.id, h.title, h.description, h.link, h.attachments, h.deadline_at, h.created_at,
              t.title as topic,
              sub.id as submission_id, sub.status, sub.feedback, sub.submitted_at
         from homeworks h
         join enrollments e on e.group_id = h.group_id and e.status='active'
    left join topics t on t.id = h.topic_id
    left join submissions sub on sub.homework_id = h.id and sub.student_id = e.student_id
        where e.student_id = $1
        order by (sub.status is null or sub.status='rework') desc, h.deadline_at nulls last, h.created_at desc`,
      [req.user!.id]);
  });

  // ------------------------------------------------ ученик: сдать
  app.post('/:id/submit', { preHandler: app.auth(['student']) }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      content: z.string().max(5000).optional(),
      attachments: z.array(z.object({ name: z.string(), url: z.string().url() })).default([]),
    }).parse(req.body);

    if (!body.content && body.attachments.length === 0) {
      throw new AppError(400, 'EMPTY', 'Прикрепи файл или напиши ссылку на проект');
    }

    const hw = await one<{ id: string; deadline_at: string | null }>(
      `select h.id, h.deadline_at
         from homeworks h
         join enrollments e on e.group_id = h.group_id and e.status='active'
        where h.id = $1 and e.student_id = $2`, [id, req.user!.id]);
    if (!hw) throw new AppError(404, 'NOT_FOUND', 'Задание не найдено');

    const onTime = !hw.deadline_at || new Date() <= new Date(hw.deadline_at);

    // Пересдача после 'rework' обновляет запись и сбрасывает статус.
    return one(
      `insert into submissions (homework_id, student_id, content, attachments, was_on_time, status)
       values ($1,$2,$3,$4,$5,'submitted')
       on conflict (homework_id, student_id) do update
         set content = excluded.content,
             attachments = excluded.attachments,
             submitted_at = now(),
             status = 'submitted',
             feedback = null,
             reviewed_at = null
       returning *`,
      [id, req.user!.id, body.content ?? null, JSON.stringify(body.attachments), onTime]);
  });
}
