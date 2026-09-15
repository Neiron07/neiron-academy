-- =====================================================================
-- Раздел «Игры» в кабинете ученика — очки за игровые сессии + рейтинг.
-- game — текстом, а не enum: игр будет несколько, список будет расти.
-- =====================================================================

create table game_scores (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(user_id) on delete cascade,
  game        text not null default 'dino',
  score       int  not null check (score >= 0),
  created_at  timestamptz not null default now()
);
create index on game_scores (game, student_id, score desc);
create index on game_scores (game, score desc);
