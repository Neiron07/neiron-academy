import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query, tx } from '../db.js';
import { AppError } from '../lib/errors.js';
import { applyCoins, assertManualLimit, awardAttendance, checkStreak } from '../lib/coins.js';
import { evaluateAchievements } from '../lib/achievements.js';
import { COIN_RULES, LESSON_EDIT_WINDOW_HOURS, MANUAL_COIN_PRESETS } from '../lib/rules.js';
import { enqueueNotification } from '../integrations/whatsapp.js';
import { audit } from '../lib/audit.js';

/** Препод имеет доступ только к своим группам. Админ — ко всем. */
async function assertLessonAccess(lessonId: string, user: { id: string; role: string }) {
  const lesson = await one<{
    id: string; group_id: string; teacher_id: string; status: string;
    scheduled_at: string; group_name: string; course_id: string;
  }>(
    `select l.id, l.group_id, l.status, l.scheduled_at,
            g.teacher_id, g.name as group_name, g.course_id
       from lessons l join groups g on g.id = l.group_id
      where l.id = $1`, [lessonId]);

  if (!lesson) throw new AppError(404, 'NOT_FOUND', 'Урок не найден');
  if (user.role === 'teacher' && lesson.teacher_id !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'Это не ваша группа');
  }
  return lesson;
}

export default async function lessonRoutes(app: FastifyInstance) {
  const staff = app.auth(['teacher', 'admin']);

  // ------------------------------------------- карточка урока + состав
  app.get('/:id', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const lesson = await assertLessonAccess(id, req.user!);

    const roster = await query(
      `select u.id            as student_id,
              u.full_name,
              s.coins_balance,
              a.status        as attendance_status,
              coalesce(mc.manual, 0) as manual_coins_given
         from enrollments e
         join students s on s.user_id = e.student_id
         join users u    on u.id = s.user_id
         left join attendance a on a.lesson_id = $1 and a.student_id = s.user_id
         left join (
           select student_id, sum(coins) as manual
             from coin_transactions
            where lesson_id = $1 and reason_code = 'manual'
            group by student_id
         ) mc on mc.student_id = s.user_id
        where e.group_id = $2 and e.status = 'active' and u.is_active
        order by u.full_name`,
      [id, lesson.group_id]);

    const topics = await query(
      `select t.id, t.title, m.title as module_title, m.sort_order as m_order, t.sort_order
         from topics t join modules m on m.id = t.module_id
        where m.course_id = $1
        order by m.sort_order, t.sort_order`, [lesson.course_id]);

    const manualUsed = await one<{ used: string }>(
      `select coalesce(sum(coins),0)::text as used from coin_transactions
        where lesson_id = $1 and reason_code = 'manual'`, [id]);

    return {
      lesson: {
        id: lesson.id, group_id: lesson.group_id, group_name: lesson.group_name,
        scheduled_at: lesson.scheduled_at, status: lesson.status,
      },
      roster, topics,
      manual: {
        used: Number(manualUsed?.used ?? 0),
        limit: 30,
        presets: MANUAL_COIN_PRESETS,
      },
    };
  });

  // --------------------------------------------- отметка посещаемости
  app.post('/:id/attendance', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      items: z.array(z.object({
        student_id: z.string().uuid(),
        status: z.enum(['present', 'late', 'excused', 'absent']),
      })).min(1),
    }).parse(req.body);

    const lesson = await assertLessonAccess(id, req.user!);
    if (lesson.status === 'cancelled') {
      throw new AppError(400, 'LESSON_CANCELLED', 'Урок отменён');
    }

    // Запись посещаемости атомарна; начисления идут после — они идемпотентны
    // по ключу att:<lesson>:<student>, поэтому повторный вызов безопасен.
    await tx(async (c) => {
      for (const item of body.items) {
        await c.query(
          `insert into attendance (lesson_id, student_id, status, marked_by)
           values ($1,$2,$3,$4)
           on conflict (lesson_id, student_id)
           do update set status = excluded.status, marked_at = now(), marked_by = excluded.marked_by`,
          [id, item.student_id, item.status, req.user!.id]);
      }
    });

    for (const item of body.items) {
      await awardAttendance(id, item.student_id, item.status, req.user!.id);
    }

    return { ok: true, marked: body.items.length };
  });

  // ------------------------------------- ручные коины от преподавателя
  app.post('/:id/coins', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      student_id: z.string().uuid(),
      coins: z.number().int().min(1).max(20),
      reason: z.string().min(3).max(200),
    }).parse(req.body);

    await assertLessonAccess(id, req.user!);
    await assertManualLimit(id, body.coins);

    const tx0 = await applyCoins({
      studentId: body.student_id,
      coins: body.coins,
      xp: body.coins,
      reasonCode: 'manual',
      reasonText: body.reason,
      lessonId: id,
      actorId: req.user!.id,
      // Ключ включает timestamp: препод может выдать коины дважды осознанно,
      // но двойной тап по кнопке в течение секунды не пройдёт.
      idempotencyKey: `manual:${id}:${body.student_id}:${Math.floor(Date.now() / 5000)}`,
    });

    await evaluateAchievements(body.student_id);
    return { ok: true, transaction: tx0 };
  });

  // ---------------------------------------------------- завершить урок
  app.post('/:id/complete', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({ topic_id: z.string().uuid().optional() }).parse(req.body ?? {});

    const lesson = await assertLessonAccess(id, req.user!);
    if (lesson.status === 'completed') return { ok: true, alreadyCompleted: true };

    const marked = await one<{ cnt: string }>(
      `select count(*)::text as cnt from attendance where lesson_id = $1`, [id]);
    const enrolled = await one<{ cnt: string }>(
      `select count(*)::text as cnt from enrollments where group_id = $1 and status='active'`,
      [lesson.group_id]);

    if (Number(marked?.cnt ?? 0) < Number(enrolled?.cnt ?? 0)) {
      throw new AppError(400, 'ATTENDANCE_INCOMPLETE',
        'Сначала отметьте посещаемость по всем ученикам группы');
    }

    await tx(async (c) => {
      await c.query(
        `update lessons set status='completed', completed_at=now(), completed_by=$2,
                topic_id = coalesce($3, topic_id)
          where id = $1`, [id, req.user!.id, body.topic_id ?? null]);
      if (body.topic_id) {
        await c.query(`update groups set current_topic_id = $2 where id = $1`,
          [lesson.group_id, body.topic_id]);
      }
    });

    // Стрики и ачивки считаем только после того, как урок стал completed.
    const students = await query<{ student_id: string; status: string }>(
      `select student_id, status from attendance where lesson_id = $1`, [id]);

    for (const s of students) {
      await checkStreak(s.student_id, id, req.user!.id);
      await evaluateAchievements(s.student_id);
      if (s.status === 'absent') await notifyAbsence(s.student_id, id);
    }

    await audit({ actorId: req.user!.id, action: 'lesson.complete', entity: 'lessons', entityId: id });
    return { ok: true };
  });

  // ----------------------------------------------- фидбек после урока
  app.post('/:id/feedback', { preHandler: staff }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      items: z.array(z.object({
        student_id: z.string().uuid().nullable(),
        kind: z.enum(['highlight', 'attention', 'group_note']),
        text: z.string().min(3).max(1000),
        can_be_public: z.boolean().default(false),
      })).min(1),
    }).parse(req.body);

    const lesson = await assertLessonAccess(id, req.user!);

    const hoursSince = (Date.now() - new Date(lesson.scheduled_at).getTime()) / 3_600_000;
    if (hoursSince > LESSON_EDIT_WINDOW_HOURS) {
      throw new AppError(400, 'WINDOW_CLOSED',
        `Обратную связь можно оставить в течение ${LESSON_EDIT_WINDOW_HOURS} часов после урока`);
    }

    await tx(async (c) => {
      for (const f of body.items) {
        await c.query(
          `insert into lesson_feedback (lesson_id, student_id, kind, text, can_be_public, created_by)
           values ($1,$2,$3,$4,$5,$6)`,
          [id, f.student_id, f.kind, f.text, f.can_be_public, req.user!.id]);
      }
    });

    // Персональный фидбек уходит родителям сразу.
    for (const f of body.items) {
      if (f.kind === 'highlight' && f.student_id) {
        await notifyFeedback(f.student_id, f.text);
      }
    }

    return { ok: true, saved: body.items.length };
  });

  // ------------------------------- отмена урока (только администратор)
  app.post('/:id/cancel', { preHandler: app.auth(['admin']) }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      reason: z.string().min(3),
      by_school: z.boolean().default(true),
    }).parse(req.body);

    const lesson = await assertLessonAccess(id, req.user!);
    if (lesson.status === 'completed') {
      throw new AppError(400, 'ALREADY_COMPLETED', 'Проведённый урок нельзя отменить');
    }

    await query(
      `update lessons set status='cancelled', cancel_reason=$2, cancelled_by_school=$3 where id=$1`,
      [id, body.reason, body.by_school]);

    // Отмена по вине школы: ребёнок не должен терять коины и урок абонемента.
    if (body.by_school) {
      const students = await query<{ student_id: string }>(
        `select student_id from enrollments where group_id = $1 and status='active'`,
        [lesson.group_id]);
      for (const s of students) {
        await applyCoins({
          studentId: s.student_id,
          coins: COIN_RULES.cancelled_by_school.coins,
          xp: COIN_RULES.cancelled_by_school.xp,
          reasonCode: 'cancelled_by_school',
          reasonText: 'Урок отменён школой',
          lessonId: id,
          actorId: req.user!.id,
          idempotencyKey: `cancel:${id}:${s.student_id}`,
        });
      }
    }

    await audit({ actorId: req.user!.id, action: 'lesson.cancel', entity: 'lessons', entityId: id, diff: body });
    return { ok: true };
  });
}

// ------------------------------------------------------- уведомления
async function notifyAbsence(studentId: string, lessonId: string) {
  const rows = await query<{ parent_id: string; phone: string; child: string; scheduled_at: string }>(
    `select ps.parent_id, pu.phone, cu.full_name as child, l.scheduled_at
       from parents_students ps
       join users pu on pu.id = ps.parent_id
       join users cu on cu.id = ps.student_id
       join lessons l on l.id = $2
      where ps.student_id = $1 and pu.phone is not null`,
    [studentId, lessonId]);

  for (const r of rows) {
    await enqueueNotification({
      recipientId: r.parent_id,
      phone: r.phone,
      templateCode: 'absence',
      body: `Neiron Academy\n${r.child} сегодня не был на занятии. Если что-то случилось — напишите нам, поможем нагнать тему.`,
      dedupeKey: `absence:${lessonId}:${studentId}`,
    });
  }
}

async function notifyFeedback(studentId: string, text: string) {
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
      templateCode: 'feedback',
      body: `Neiron Academy\nСегодня на уроке ${r.child} отличился:\n«${text}»`,
      dedupeKey: `fb:${studentId}:${Date.now()}`,
    });
  }
}
