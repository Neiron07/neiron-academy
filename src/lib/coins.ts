import { one, query } from '../db.js';
import { COIN_RULES, MANUAL_COINS_PER_LESSON_LIMIT } from './rules.js';
import { AppError } from './errors.js';

export interface CoinTx {
  id: string;
  student_id: string;
  coins: number;
  xp: number;
  reason_code: string;
  created_at: string;
}

/**
 * Единственная точка изменения баланса. Всегда через SQL-функцию apply_coins:
 * она держит блокировку строки ученика, проверяет неотрицательность баланса
 * и гарантирует идемпотентность по ключу.
 *
 * Ключ идемпотентности обязателен для всех автоматических начислений —
 * иначе повторная отметка посещаемости начислит коины дважды.
 */
export async function applyCoins(params: {
  studentId: string;
  coins: number;
  xp: number;
  reasonCode: string;
  reasonText?: string;
  lessonId?: string | null;
  orderId?: string | null;
  actorId?: string | null;
  idempotencyKey: string;
}): Promise<CoinTx> {
  const row = await one<CoinTx>(
    `select * from apply_coins($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      params.studentId,
      params.coins,
      params.xp,
      params.reasonCode,
      params.reasonText ?? null,
      params.lessonId ?? null,
      params.orderId ?? null,
      params.actorId ?? null,
      params.idempotencyKey,
    ],
  );
  if (!row) throw new AppError(500, 'COIN_APPLY_FAILED', 'Не удалось начислить коины');
  return row;
}

/** Начисления за посещаемость. Идемпотентны по паре (урок, ученик). */
export async function awardAttendance(
  lessonId: string,
  studentId: string,
  status: 'present' | 'late' | 'excused' | 'absent',
  actorId: string,
) {
  if (status === 'excused' || status === 'absent') return;

  await applyCoins({
    studentId,
    coins: COIN_RULES.attendance.coins,
    xp: COIN_RULES.attendance.xp,
    reasonCode: 'attendance',
    reasonText: 'Посещение урока',
    lessonId,
    actorId,
    idempotencyKey: `att:${lessonId}:${studentId}`,
  });

  if (status === 'present') {
    await applyCoins({
      studentId,
      coins: COIN_RULES.punctual.coins,
      xp: COIN_RULES.punctual.xp,
      reasonCode: 'punctual',
      reasonText: 'Пришёл вовремя',
      lessonId,
      actorId,
      idempotencyKey: `punc:${lessonId}:${studentId}`,
    });
  }
}

/**
 * Стрик: 4 завершённых урока подряд без пропусков.
 * Начисляем на каждом 4-м, 8-м, 12-м уроке серии.
 */
export async function checkStreak(studentId: string, lessonId: string, actorId: string) {
  const rows = await query<{ status: string }>(
    `select a.status
       from attendance a
       join lessons l on l.id = a.lesson_id
      where a.student_id = $1 and l.status = 'completed'
      order by l.scheduled_at desc
      limit 12`,
    [studentId],
  );

  let streak = 0;
  for (const r of rows) {
    if (r.status === 'present' || r.status === 'late') streak++;
    else break;
  }

  if (streak > 0 && streak % 4 === 0) {
    await applyCoins({
      studentId,
      coins: COIN_RULES.streak_4.coins,
      xp: COIN_RULES.streak_4.xp,
      reasonCode: 'streak',
      reasonText: `${streak} уроков подряд без пропусков`,
      lessonId,
      actorId,
      idempotencyKey: `streak:${studentId}:${streak}`,
    });
  }
  return streak;
}

/** Проверка лимита ручных коинов преподавателя на конкретный урок. */
export async function assertManualLimit(lessonId: string, adding: number) {
  const row = await one<{ manual_coins: string | null }>(
    `select coalesce(sum(coins),0)::text as manual_coins
       from coin_transactions
      where lesson_id = $1 and reason_code = 'manual'`,
    [lessonId],
  );
  const used = Number(row?.manual_coins ?? 0);
  if (used + adding > MANUAL_COINS_PER_LESSON_LIMIT) {
    throw new AppError(
      400,
      'MANUAL_LIMIT_EXCEEDED',
      `Лимит ручных коинов на урок — ${MANUAL_COINS_PER_LESSON_LIMIT}. Уже выдано ${used}.`,
    );
  }
  return used;
}
