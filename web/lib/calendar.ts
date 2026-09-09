/** Сегодняшняя дата (YYYY-MM-DD) по календарю Алматы, а не браузера. */
export function almatyToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Almaty',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Семь дат недели (Пн—Вс), содержащей сегодня + offset недель. */
export function weekDays(offset: number): string[] {
  const today = almatyToday();
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Вс..6=Сб
  const mondayShift = dow === 0 ? -6 : 1 - dow;
  const monday = addDaysToKey(today, mondayShift + offset * 7);
  return Array.from({ length: 7 }, (_, i) => addDaysToKey(monday, i));
}
