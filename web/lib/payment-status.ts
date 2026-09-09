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

/**
 * Классы для бейджа даты оплаты — светофор по явному запросу: просрочено красным,
 * сегодня зелёным, меньше 5 дней жёлтым, дальше — без цвета, обычным нейтральным.
 * Сознательно вне обычной 7-цветной палитры продукта — только для этого индикатора.
 */
export function paymentBadgeClass(days: number): string {
  if (days < 0) return 'border-[#F87171] bg-[#F87171]/15 text-[#F87171]';
  if (days === 0) return 'border-[#4ADE80] bg-[#4ADE80]/15 text-[#4ADE80]';
  if (days < 5) return 'border-[#FBBF24] bg-[#FBBF24]/15 text-[#FBBF24]';
  return 'border-purple-mid text-lavender';
}
