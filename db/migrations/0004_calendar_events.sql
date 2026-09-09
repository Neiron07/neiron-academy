-- =====================================================================
-- Календарь администратора: пробные уроки и разовые события.
-- Отдельно от lessons — эти записи не тянут за собой посещаемость, коины
-- и абонемент (источник истины для экономики остаётся только lessons).
-- =====================================================================

create type calendar_event_kind as enum ('trial', 'event');

create table calendar_events (
  id            uuid primary key default gen_random_uuid(),
  branch_id     uuid not null references branches(id),
  kind          calendar_event_kind not null default 'event',
  title         text not null,
  description   text,
  starts_at     timestamptz not null,
  duration_min  int not null default 60 check (duration_min > 0),
  teacher_id    uuid references users(id),
  room          text,
  contact_name  text,
  contact_phone text,
  lead_id       uuid references leads(id),
  created_by    uuid references users(id),
  created_at    timestamptz not null default now()
);
create index on calendar_events (starts_at);
create index on calendar_events (teacher_id, starts_at);
