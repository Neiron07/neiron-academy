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

/**
 * Светофор по приоритету — та же осознанная точечная палитра, что и у бейджа
 * оплаты (lib/payment-status.ts): высокий красным, средний жёлтым, низкий зелёным.
 */
export const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: 'bg-[#4ADE80]',
  medium: 'bg-[#FBBF24]',
  high: 'bg-[#F87171]',
};

export const PRIORITY_TEXT: Record<TaskPriority, string> = {
  low: 'text-[#4ADE80]',
  medium: 'text-[#FBBF24]',
  high: 'text-[#F87171]',
};

export const TYPE_LABEL: Record<TaskType, string> = {
  assigned: 'Назначенная',
  pool: 'Из пула',
  personal: 'Личная',
  recurring: 'Повторяющаяся',
  automatic: 'Автоматическая',
};

export const WEEKDAY_LABEL = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
