import type { TaskPriority, TaskStatus, TaskType } from './types';

export const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'new', label: 'Новая' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'review', label: 'На проверке' },
  { id: 'done', label: 'Выполнена' },
  { id: 'canceled', label: 'Отменена' },
];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: 'bg-muted',
  medium: 'bg-lavender',
  high: 'bg-white',
};

export const TYPE_LABEL: Record<TaskType, string> = {
  assigned: 'Назначенная',
  pool: 'Из пула',
  personal: 'Личная',
  recurring: 'Повторяющаяся',
  automatic: 'Автоматическая',
};

export const WEEKDAY_LABEL = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
