export const SCHOOL_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? '77471655391';

export function waLink(text: string, phone: string = SCHOOL_WHATSAPP) {
  const digits = phone.replace(/\D/g, '');
  return `https://api.whatsapp.com/send/?phone=${digits}&text=${encodeURIComponent(text)}`;
}

/** Просто открыть переписку с номером, без готового текста (например, клик по телефону родителя). */
export function waChatLink(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://api.whatsapp.com/send/?phone=${digits}`;
}

/** Человеческие сообщения для кодов ошибок, которые нужно объяснить отдельно от message с бэкенда. */
export const ERROR_HINTS: Record<string, string> = {
  INSUFFICIENT_COINS: 'Не хватает коинов на это. Скопи ещё немного и возвращайся.',
  MANUAL_LIMIT_EXCEEDED: 'Лимит ручных коинов на этот урок исчерпан.',
  ATTENDANCE_INCOMPLETE: 'Сначала отметьте посещаемость всем ученикам группы.',
  WINDOW_CLOSED: 'Окно для этого действия закрыто — прошло больше 24 часов после урока.',
  OUT_OF_STOCK: 'Товар закончился.',
  GROUP_FULL: 'В группе нет свободных мест.',
  LOCKED: 'Слишком много попыток. Подождите немного и попробуйте снова.',
};

export const ATTENDANCE_LABEL: Record<string, string> = {
  present: 'Был',
  late: 'Опоздал',
  excused: 'Пропустил по уважительной',
  absent: 'Прогул',
};

/** Зеркало MANUAL_REASONS из src/lib/rules.ts — бэкенд не отдаёт список причин по API. */
export const MANUAL_REASONS = [
  'Активно работал на уроке',
  'Помог однокласснику',
  'Задал отличный вопрос',
  'Доделал проект сверх задания',
  'Помог с уборкой рабочего места',
] as const;
