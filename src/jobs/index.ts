import { Cron } from 'croner';
import { one, query } from '../db.js';
import { flushNotifications, enqueueNotification } from '../integrations/whatsapp.js';
import { grantAchievement } from '../lib/achievements.js';
import { LOW_BALANCE_THRESHOLD } from '../lib/rules.js';

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

  log.info({ count: jobs.length }, 'jobs: планировщик запущен');
  return jobs;
}
