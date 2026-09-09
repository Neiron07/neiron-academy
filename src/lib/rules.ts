/**
 * Экономика платформы. ЕДИНСТВЕННОЕ место, где заданы цифры начислений.
 * В v1 сознательно захардкожено — конструктор правил в админке не делаем.
 *
 * Бюджетный расчёт (12 уроков в месяц, 3 раза в неделю):
 *   посещение          12 × 10 = 120
 *   без опозданий      12 ×  5 =  60
 *   домашки в срок      8 × 15 = 120
 *   часть на «отлично»  4 × 10 =  40
 *   стрики              3 × 30 =  90
 *   ручные от препода          ≈  60
 *   ---------------------------------
 *   потолок ученика в месяц    ≈ 490 коинов
 *
 * Ориентир по себестоимости: держите расходы магазина ≤ 5% выручки.
 * Проверять ежемесячно отчётом /admin/shop-report.
 */

export const COIN_RULES = {
  attendance:        { coins: 10, xp: 10 },   // пришёл на урок
  punctual:          { coins: 5,  xp: 5  },   // пришёл вовремя (не 'late')
  cancelled_by_school: { coins: 10, xp: 10 }, // урок отменила школа — ребёнок не виноват
  homework_on_time:  { coins: 15, xp: 15 },   // домашка принята и сдана в срок
  homework_late:     { coins: 7,  xp: 7  },   // принята, но после дедлайна
  homework_excellent:{ coins: 10, xp: 10 },   // надбавка за «отлично»
  streak_4:          { coins: 30, xp: 30 },   // 4 урока подряд без пропусков
  module_done:       { coins: 50, xp: 100 },
  course_done:       { coins: 100, xp: 200 },
} as const;

/** Лимит ручных коинов преподавателя на ОДИН урок (на всю группу). */
export const MANUAL_COINS_PER_LESSON_LIMIT = 30;

/** Допустимые пресеты ручного начисления. */
export const MANUAL_COIN_PRESETS = [5, 10, 20] as const;

export const MANUAL_REASONS = [
  'Активно работал на уроке',
  'Помог однокласснику',
  'Задал отличный вопрос',
  'Доделал проект сверх задания',
  'Помог с уборкой рабочего места',
] as const;

/** Окно, в которое препод может отметить посещаемость и оставить фидбек. */
export const LESSON_EDIT_WINDOW_HOURS = 24;

// --------------------------------------------------------------- уровни
/** Пороги XP для уровней 1..10. */
export const LEVEL_THRESHOLDS = [0, 150, 400, 750, 1200, 1800, 2600, 3600, 5000, 7000];

/** 5 стадий эволюции маскота — по две ступени уровня на стадию. */
export const MASCOT_STAGES = [
  { stage: 1, minLevel: 1,  code: 'egg',      title: 'Яйцо' },
  { stage: 2, minLevel: 3,  code: 'chick',    title: 'Робо-птенец' },
  { stage: 3, minLevel: 5,  code: 'student',  title: 'Робот-ученик' },
  { stage: 4, minLevel: 7,  code: 'engineer', title: 'Робот-инженер' },
  { stage: 5, minLevel: 9,  code: 'master',   title: 'Робот-мастер' },
];

export function levelFromXp(xp: number) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]!) level = i + 1;
  }
  const isMax = level >= LEVEL_THRESHOLDS.length;
  const currentFloor = LEVEL_THRESHOLDS[level - 1]!;
  const nextFloor = isMax ? currentFloor : LEVEL_THRESHOLDS[level]!;
  const stage = [...MASCOT_STAGES].reverse().find((s) => level >= s.minLevel) ?? MASCOT_STAGES[0]!;

  return {
    level,
    xp,
    stage: stage.stage,
    stageCode: stage.code,
    stageTitle: stage.title,
    xpIntoLevel: xp - currentFloor,
    xpForNextLevel: isMax ? 0 : nextFloor - currentFloor,
    xpToNextLevel: isMax ? 0 : nextFloor - xp,
    progressPercent: isMax ? 100 : Math.round(((xp - currentFloor) / (nextFloor - currentFloor)) * 100),
    isMax,
  };
}

/** Списывается ли урок с абонемента. Совпадает с v_lesson_balance. */
export const BILLABLE_ATTENDANCE = ['present', 'late', 'absent'] as const;

/** Порог предупреждения об окончании абонемента. */
export const LOW_BALANCE_THRESHOLD = 2;
