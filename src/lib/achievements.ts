import { one, query } from '../db.js';
import { applyCoins } from './coins.js';

/**
 * Движок ачивок. Все 12 ачивок v1 выдаются автоматически.
 * Вызывается после: отметки посещаемости, проверки домашки, покупки в магазине.
 * Идемпотентен — student_achievements имеет PK (student_id, code).
 */

type Check = (studentId: string) => Promise<boolean>;

const CHECKS: Record<string, Check> = {
  first_step: async (s) =>
    !!(await one(
      `select 1 from attendance a join lessons l on l.id = a.lesson_id
        where a.student_id = $1 and a.status in ('present','late') and l.status='completed' limit 1`, [s])),

  first_project: async (s) =>
    !!(await one(
      `select 1 from submissions where student_id = $1 and status in ('accepted','excellent') limit 1`, [s])),

  no_day_off: async (s) => {
    const rows = await query<{ status: string }>(
      `select a.status from attendance a join lessons l on l.id = a.lesson_id
        where a.student_id = $1 and l.status='completed'
        order by l.scheduled_at desc limit 8`, [s]);
    return rows.length === 8 && rows.every((r) => r.status === 'present' || r.status === 'late');
  },

  early_bird: async (s) =>
    !!(await one(
      `select 1 from attendance where student_id = $1 and status='present'
        having count(*) >= 10`, [s])),

  iron_month: async (s) =>
    !!(await one(
      `select 1
         from attendance a
         join lessons l on l.id = a.lesson_id
        where a.student_id = $1 and l.status='completed'
          and l.scheduled_at >= date_trunc('month', now() - interval '1 month')
          and l.scheduled_at <  date_trunc('month', now())
        group by date_trunc('month', l.scheduled_at)
       having count(*) >= 8
          and count(*) filter (where a.status in ('present','late')) = count(*)`, [s])),

  straight_a: async (s) => {
    const rows = await query<{ status: string }>(
      `select status from submissions
        where student_id = $1 and reviewed_at is not null
        order by reviewed_at desc limit 5`, [s]);
    return rows.length === 5 && rows.every((r) => r.status === 'excellent');
  },

  no_rework: async (s) =>
    !!(await one(
      `select 1 from submissions
        where student_id = $1 and status in ('accepted','excellent')
        having count(*) >= 10`, [s])),

  marathoner: async (s) =>
    !!(await one(
      `select 1 from coin_transactions where student_id=$1 and reason_code='module_done' limit 1`, [s])),

  graduate: async (s) =>
    !!(await one(
      `select 1 from coin_transactions where student_id=$1 and reason_code='course_done' limit 1`, [s])),

  rich: async (s) =>
    !!(await one(`select 1 from students where user_id = $1 and coins_balance >= 500`, [s])),

  pioneer: async (s) =>
    !!(await one(
      `select 1 from (
         select user_id from students order by joined_at, user_id limit 20
       ) t where t.user_id = $1`, [s])),

  // group_champ выдаётся ежемесячным job'ом, не по событию
};

export async function evaluateAchievements(studentId: string): Promise<string[]> {
  const owned = await query<{ code: string }>(
    `select code from student_achievements where student_id = $1`, [studentId]);
  const ownedSet = new Set(owned.map((r) => r.code));

  const earned: string[] = [];

  for (const [code, check] of Object.entries(CHECKS)) {
    if (ownedSet.has(code)) continue;
    try {
      if (await check(studentId)) {
        await grantAchievement(studentId, code);
        earned.push(code);
      }
    } catch {
      // Одна сломанная проверка не должна ронять остальные.
    }
  }
  return earned;
}

export async function grantAchievement(studentId: string, code: string) {
  const inserted = await one<{ code: string }>(
    `insert into student_achievements (student_id, code) values ($1,$2)
     on conflict do nothing returning code`, [studentId, code]);
  if (!inserted) return false;

  const ach = await one<{ title: string; reward_coins: number }>(
    `select title, reward_coins from achievements where code = $1`, [code]);

  if (ach && ach.reward_coins > 0) {
    await applyCoins({
      studentId,
      coins: ach.reward_coins,
      xp: ach.reward_coins,
      reasonCode: 'achievement',
      reasonText: `Ачивка: ${ach.title}`,
      idempotencyKey: `ach:${studentId}:${code}`,
    });
  }
  return true;
}
