const TZ = 'Asia/Almaty';

const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: TZ });
const dateYearFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
const weekdayFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', timeZone: TZ });
const monthFmt = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: TZ });

function almatyDateKey(d: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** «Сегодня в 16:00», «вчера», «12 сентября» — относительные формулировки для недавних дат. */
export function formatRelativeDateTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const dayDiff = Math.round(
    (Date.parse(almatyDateKey(d)) - Date.parse(almatyDateKey(now))) / 86_400_000,
  );

  const time = timeFmt.format(d);
  if (dayDiff === 0) return `сегодня в ${time}`;
  if (dayDiff === -1) return `вчера в ${time}`;
  if (dayDiff === 1) return `завтра в ${time}`;

  const sameYear = d.getFullYear() === now.getFullYear();
  const date = sameYear ? dateFmt.format(d) : dateYearFmt.format(d);
  return `${date} в ${time}`;
}

export function formatDate(iso: string): string {
  const sameYear = new Date(iso).getFullYear() === new Date().getFullYear();
  return sameYear ? dateFmt.format(new Date(iso)) : dateYearFmt.format(new Date(iso));
}

export function formatWeekday(iso: string): string {
  return weekdayFmt.format(new Date(iso)).replace('.', '');
}

export function formatDay(iso: string): string {
  return dayFmt.format(new Date(iso));
}

export function formatMonth(iso: string): string {
  return monthFmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function almatyDayKey(iso: string): string {
  return almatyDateKey(new Date(iso));
}

/** Тенге с неразрывным пробелом: 35 000 ₸ */
export function formatKzt(amount: number): string {
  return `${amount.toLocaleString('ru-RU').replace(/\s/g, ' ')} ₸`;
}

/** Коины/XP — без разделителей до 9999 */
export function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU');
}
