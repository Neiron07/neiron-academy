-- =====================================================================
-- Публичный профиль преподавателя (фото-ссылка, опыт, достижения) —
-- виден ученикам и родителям. Отдельная таблица, как students/user_id:
-- не у каждого пользователя есть такой профиль (только у teacher-ов),
-- и большинство полей необязательны.
-- =====================================================================

create table teacher_profiles (
  user_id      uuid primary key references users(id) on delete cascade,
  bio          text,
  experience   text,
  photo_url    text,
  achievements jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Флаг «прошёл вводный экран» — показываем инструкцию по платформе
-- только при первом визите ученика/родителя.
-- ---------------------------------------------------------------------
alter table users add column if not exists onboarded_at timestamptz;
