/**
 * Оценка даты следующей оплаты: последний платёж + сколько недель хватит
 * оставшихся оплаченных уроков в темпе группы (уроков в неделю по расписанию).
 * Точной даты в системе нет — оплата разовая (сумма + кол-во уроков), это оценка.
 */
export function estimateNextPayment(
  lastPaymentAt: string | Date | null,
  lessonsLeft: number | string | null,
  weeklyLessons: number | string | null,
): string | null {
  if (!lastPaymentAt || lessonsLeft === null || lessonsLeft === undefined) return null;
  const weekly = Number(weeklyLessons ?? 0);
  if (weekly <= 0) return null;

  const weeks = Math.max(0, Math.ceil(Number(lessonsLeft) / weekly));
  const d = new Date(lastPaymentAt);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString();
}
