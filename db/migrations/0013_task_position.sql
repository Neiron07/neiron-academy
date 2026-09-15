-- =====================================================================
-- Ручной порядок задач внутри колонки — сотрудник сам расставляет свои
-- задачи, а не только по приоритету/дате создания.
-- =====================================================================

alter table tasks add column if not exists position double precision
  not null default extract(epoch from now());
create index if not exists tasks_position_idx on tasks (status, position);
