-- =====================================================================
-- Таск-трекер для сотрудников: назначенные / из общего пула / личные /
-- повторяющиеся (по шаблону) / автоматические (создаются джобами) задачи
-- с канбан-статусами.
-- =====================================================================

create type task_status   as enum ('new', 'in_progress', 'review', 'done', 'canceled');
create type task_type     as enum ('assigned', 'pool', 'personal', 'recurring', 'automatic');
create type task_priority as enum ('low', 'medium', 'high');

-- Шаблоны повторяющихся задач — джоба раскатывает из них конкретные tasks
-- по расписанию (weekday, как в group_schedule: ISO 1=Пн..7=Вс).
create table task_templates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  priority    task_priority not null default 'medium',
  assignee_id uuid references users(id) on delete set null,  -- null = уходит в общий пул
  weekday     int not null check (weekday between 1 and 7),
  is_active   boolean not null default true,
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);

create table tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  status       task_status not null default 'new',
  type         task_type not null default 'assigned',
  priority     task_priority not null default 'medium',
  assignee_id  uuid references users(id) on delete set null,   -- null = свободна, в пуле
  created_by   uuid references users(id) on delete set null,
  due_at       timestamptz,
  template_id  uuid references task_templates(id) on delete set null,
  source_key   text,        -- ключ дедупликации для recurring/automatic
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Пока задача открыта (не done/canceled), второй с тем же source_key не создать —
-- джобы используют ON CONFLICT (source_key) WHERE ... DO NOTHING с тем же условием.
-- После закрытия задачи ключ освобождается: если проблема повторится, заведётся новая.
create unique index tasks_source_key_open_uq on tasks (source_key)
  where source_key is not null and status not in ('done', 'canceled');

create index tasks_assignee_status_idx on tasks (assignee_id, status);
create index tasks_open_idx on tasks (status) where status not in ('done', 'canceled');
create index tasks_type_idx on tasks (type);
