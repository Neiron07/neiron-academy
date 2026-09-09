/** Дней до/после оценочной даты следующей оплаты. Положительное — впереди, отрицательное — просрочено. */
export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.round(ms / 86_400_000);
}

export function paymentLabel(days: number): string {
  if (days < 0) return `Просрочено ${Math.abs(days)} дн.`;
  if (days === 0) return 'Сегодня';
  return `Через ${days} дн.`;
}

/** Классы для компактного бейджа — без заливки-инверсии на каждую строку таблицы, просто ярче текст для срочного. */
export function paymentBadgeClass(days: number): string {
  if (days < 0) return 'border-purple bg-purple/15 text-white';
  if (days <= 3) return 'border-purple-mid text-white';
  return 'border-purple-mid text-lavender';
}
