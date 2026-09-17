import { Cron } from 'croner';
import { one, query } from '../db.js';
import { flushNotifications, enqueueNotification } from '../integrations/whatsapp.js';
import { flushTelegramNotifications, enqueueTelegramNotification } from '../integrations/telegram.js';
import { grantAchievement } from '../lib/achievements.js';
import { LOW_BALANCE_THRESHOLD } from '../lib/rules.js';
import { estimateNextPayment } from '../lib/payments.js';

const TZ = 'Asia/Almaty';

export function startJobs(log: { info: (o: any, m?: string) => void; error: (o: any) => void }) {
  const jobs: Cron[] = [];

  // Раскатка расписания на 14 дней вперёд — каждый день в 03:00
  jobs.push(new Cron('0 3 * * *', { timezone: TZ }, async () => {
    const r = await one<{ generate_lessons: number }>(`select generate_lessons(14)`);
    log.info({ created: r?.generate_lessons }, 'jobs: уроки сгенерированы');
  }));

  // Очередь уведомлений — каждую минуту
  jobs.push(new Cron('* * * * *', { timezone: TZ }, async () => {
    try { await flushNotifications(20); } catch (e) { log.error(e); }
    try { await flushTelegramNotifications(20); } catch (e) { log.error(e); }
  }));

  // Напоминания персоналу в Telegram — пробные/события и обычные уроки за
  // ~час до начала, чтобы менеджер мог проконтролировать и подтолкнуть препода.
  // Окно (50–70 мин) шире шага крона (15 мин) намеренно — dedupe_key защищает
  // от повторной отправки того же урока/события на соседнем тике.
  jobs.push(new Cron('*/15 * * * *', { timezone: TZ }, async () => {
    const events = await query<{
      id: string; kind: 'trial' | 'event'; title: string; starts_at: string;
      room: string | null; contact_name: string | null; contact_phone: string | null;
      teacher_name: string | null; branch_name: string | null;
    }>(
      `select e.id, e.kind, e.title, e.starts_at, e.room, e.contact_name, e.contact_phone,
              u.full_name as teacher_name, b.name as branch_name
         from calendar_events e
    left join users u on u.id = e.teacher_id
    left join branches b on b.id = e.branch_id
        where e.starts_at between now() + interval '50 minutes' and now() + interval '70 minutes'`);

    for (const e of events) {
      const time = new Date(e.starts_at).toLocaleTimeString('ru-RU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
      const location = [e.branch_name, e.room].filter(Boolean).join(', ');
      const lines = [
        `${e.kind === 'trial' ? '🎓 Пробный урок' : '📌 Событие'} через час — «${e.title}»`,
        `🕐 ${time}`,
        e.teacher_name ? `👨‍🏫 ${e.teacher_name}` : '👨‍🏫 преподаватель не назначен',
        location && `📍 ${location}`,
        e.contact_name ? `👤 ${[e.contact_name, e.contact_phone].filter(Boolean).join(' · ')}` : null,
      ].filter(Boolean);
      await enqueueTelegramNotification({ body: lines.join('\n'), dedupeKey: `tg:event:${e.id}` });
    }

    const lessons = await query<{
      id: string; scheduled_at: string; group_name: string; room: string | null;
      course_name: string; teacher_name: string | null; branch_name: string | null;
    }>(
      `select l.id, l.scheduled_at, g.name as group_name, g.room, c.name as course_name,
              u.full_name as teacher_name, b.name as branch_name
         from lessons l
         join groups g on g.id = l.group_id
         join courses c on c.id = g.course_id
    left join users u on u.id = g.teacher_id
    left join branches b on b.id = g.branch_id
        where l.status = 'planned' and g.status = 'active'
          and l.scheduled_at between now() + interval '50 minutes' and now() + interval '70 minutes'`);

    for (const l of lessons) {
      const time = new Date(l.scheduled_at).toLocaleTimeString('ru-RU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
      const location = [l.branch_name, l.room].filter(Boolean).join(', ');
      const lines = [
        `📚 Урок через час — ${l.group_name} (${l.course_name})`,
        `🕐 ${time}`,
        l.teacher_name ? `👨‍🏫 ${l.teacher_name}` : '👨‍🏫 преподаватель не назначен',
        location && `📍 ${location}`,
      ].filter(Boolean);
      await enqueueTelegramNotification({ body: lines.join('\n'), dedupeKey: `tg:lesson:${l.id}` });
    }
  }));

  // Напоминание об уроке — каждые 15 минут, за 2 часа до занятия
  jobs.push(new Cron('*/15 * * * *', { timezone: TZ }, async () => {
    const rows = await query<{ parent_id: string; phone: string; child: string; at: string; lesson_id: string }>(
      `select ps.parent_id, pu.phone, cu.full_name as child, l.scheduled_at as at, l.id as lesson_id
         from lessons l
         join enrollments e on e.group_id = l.group_id and e.status='active'
         join parents_students ps on ps.student_id = e.student_id
         join users pu on pu.id = ps.parent_id
         join users cu on cu.id = ps.student_id
        where l.status='planned'
          and l.scheduled_at between now() + interval '105 minutes' and now() + interval '120 minutes'
          and pu.phone is not null`);

    for (const r of rows) {
      const time = new Date(r.at).toLocaleTimeString('ru-RU',
        { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
      await enqueueNotification({
        recipientId: r.parent_id,
        phone: r.phone,
        templateCode: 'reminder',
        body: `Neiron Academy\nНапоминаем: сегодня в ${time} занятие у ${r.child}.`,
        dedupeKey: `rem:${r.lesson_id}:${r.parent_id}`,
      });
    }
  }));

  // Абонемент заканчивается — ежедневно в 18:00
  jobs.push(new Cron('0 18 * * *', { timezone: TZ }, async () => {
    const rows = await query<{ parent_id: string; phone: string; child: string; lessons_left: number; sid: string }>(
      `select ps.parent_id, pu.phone, cu.full_name as child, lb.lessons_left, lb.student_id as sid
         from v_lesson_balance lb
         join parents_students ps on ps.student_id = lb.student_id
         join users pu on pu.id = ps.parent_id
         join users cu on cu.id = ps.student_id
        where lb.lessons_left <= $1 and lb.lessons_left >= 0 and pu.phone is not null and cu.is_active`,
      [LOW_BALANCE_THRESHOLD]);

    for (const r of rows) {
      await enqueueNotification({
        recipientId: r.parent_id,
        phone: r.phone,
        templateCode: 'low_balance',
        body: `Neiron Academy\nУ ${r.child} осталось ${r.lessons_left} занятий по абонементу. `
            + `Напишите нам, чтобы продлить — так место в группе останется за ребёнком.`,
        dedupeKey: `low:${r.sid}:${new Date().toISOString().slice(0, 10)}`,
      });
    }
  }));

  // Чемпион группы — 1 числа в 09:00 по итогам прошлого месяца
  jobs.push(new Cron('0 9 1 * *', { timezone: TZ }, async () => {
    const winners = await query<{ student_id: string }>(
      `with month_xp as (
         select ct.student_id, e.group_id, sum(ct.xp) as xp
           from coin_transactions ct
           join enrollments e on e.student_id = ct.student_id and e.status='active'
          where ct.created_at >= date_trunc('month', now() - interval '1 month')
            and ct.created_at <  date_trunc('month', now())
          group by ct.student_id, e.group_id
       ),
       ranked as (
         select *, row_number() over (partition by group_id order by xp desc) as rn from month_xp
       )
       select student_id from ranked where rn = 1 and xp > 0`);

    for (const w of winners) await grantAchievement(w.student_id, 'group_champ');
    log.info({ winners: winners.length }, 'jobs: чемпионы месяца определены');
  }));

  // Чистка отработавших OTP — раз в сутки
  jobs.push(new Cron('30 4 * * *', { timezone: TZ }, async () => {
    await query(`delete from otp_codes where created_at < now() - interval '3 days'`);
  }));

  // Повторяющиеся задачи — раскатка активных шаблонов на сегодняшний день недели.
  // Пока предыдущий экземпляр шаблона не закрыт (done/canceled), новый не создаётся —
  // это держит partial unique индекс tasks_source_key_open_uq.
  jobs.push(new Cron('0 6 * * *', { timezone: TZ }, async () => {
    const WEEKDAY: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    const label = new Date().toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short' });
    const weekday = WEEKDAY[label];
    if (!weekday) return;

    const templates = await query<{
      id: string; title: string; description: string | null; priority: string; assignee_id: string | null; created_by: string | null;
    }>(`select id, title, description, priority, assignee_id, created_by from task_templates
         where is_active and weekday = $1`, [weekday]);

    let created = 0;
    for (const t of templates) {
      const r = await one(
        `insert into tasks (title, description, type, priority, assignee_id, created_by, template_id, source_key)
         values ($1,$2,'recurring',$3,$4,$5,$6,$7)
         on conflict (source_key) where source_key is not null and status not in ('done','canceled') do nothing
         returning id`,
        [t.title, t.description, t.priority, t.assignee_id, t.created_by, t.id, `template:${t.id}`]);
      if (r) created++;
    }
    if (created) log.info({ created }, 'jobs: повторяющиеся задачи созданы');
  }));

  // Автоматические задачи по просроченной оплате — раз в сутки, свои для тех же
  // студентов не дублируются, пока предыдущая задача не закрыта (done/canceled).
  jobs.push(new Cron('0 9 * * *', { timezone: TZ }, async () => {
    const rows = await query<{
      id: string; full_name: string; last_payment_at: string; lessons_left: number; weekly_lessons: number;
    }>(`select u.id, u.full_name, pay.last_payment_at, pay.lessons_left, pay.weekly_lessons
          from users u join v_student_payment_status pay on pay.student_id = u.id
         where u.role = 'student' and u.is_active and pay.last_payment_at is not null`);

    let created = 0;
    for (const r of rows) {
      const estimate = estimateNextPayment(r.last_payment_at, r.lessons_left, r.weekly_lessons);
      if (!estimate) continue;
      const days = Math.round((new Date(estimate).getTime() - Date.now()) / 86_400_000);
      if (days > 0) continue;

      const row = await one(
        `insert into tasks (title, description, type, priority, source_key)
         values ($1,$2,'automatic','high',$3)
         on conflict (source_key) where source_key is not null and status not in ('done','canceled') do nothing
         returning id`,
        [`Просрочена оплата: ${r.full_name}`,
         `Ожидаемая дата оплаты — ${new Date(estimate).toLocaleDateString('ru-RU', { timeZone: TZ })}. Свяжитесь с родителем.`,
         `payment_overdue:${r.id}`]);
      if (row) created++;
    }
    if (created) log.info({ created }, 'jobs: задачи по просроченным оплатам созданы');
  }));

  log.info({ count: jobs.length }, 'jobs: планировщик запущен');
  return jobs;
}
