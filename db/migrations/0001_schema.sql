-- =====================================================================
-- Neiron Platform — v1 schema
-- Postgres 15 (Supabase). Запускать целиком, идемпотентно не является —
-- применять один раз на чистой базе.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
create type user_role        as enum ('admin', 'teacher', 'student', 'parent');
create type group_status     as enum ('active', 'archived');
create type lesson_status    as enum ('planned', 'completed', 'cancelled');
create type attend_status    as enum ('present', 'late', 'excused', 'absent');
create type enroll_status    as enum ('active', 'paused', 'left');
create type shop_kind        as enum ('physical', 'virtual', 'privilege');
create type order_status     as enum ('pending', 'issued', 'cancelled');
create type submission_status as enum ('submitted', 'rework', 'accepted', 'excellent');
create type feedback_kind    as enum ('highlight', 'attention', 'group_note');
create type payment_method   as enum ('kaspi', 'cash', 'transfer');
create type lead_status      as enum ('new', 'contacted', 'trial', 'won', 'lost');
create type notify_status    as enum ('queued', 'sent', 'failed');
create type achievement_tier as enum ('bronze', 'silver', 'gold');

-- ------------------------------------------------------------- branches
create table branches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  timezone    text not null default 'Asia/Almaty',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- users
-- Одна таблица на все роли. Способ входа зависит от роли:
--   admin/teacher -> phone + password_hash
--   parent        -> phone + одноразовый код в WhatsApp
--   student       -> login + pin_hash
create table users (
  id             uuid primary key default gen_random_uuid(),
  branch_id      uuid references branches(id) on delete restrict,
  role           user_role not null,
  full_name      text not null,
  phone          text unique,                 -- E.164: +77011234567
  login          text unique,                 -- только для учеников
  password_hash  text,
  pin_hash       text,
  is_active      boolean not null default true,
  token_version  int not null default 1,      -- инвалидация всех сессий
  failed_attempts int not null default 0,
  locked_until   timestamptz,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  created_by     uuid references users(id),

  constraint staff_needs_password check (role not in ('admin','teacher') or password_hash is not null),
  constraint student_needs_login  check (role <> 'student' or (login is not null and pin_hash is not null)),
  constraint parent_needs_phone   check (role <> 'parent'  or phone is not null)
);
create index on users (role, is_active);
create index on users (branch_id);

-- ------------------------------------------------------------- students
create table students (
  user_id        uuid primary key references users(id) on delete cascade,
  birth_date     date,
  coins_balance  int  not null default 0 check (coins_balance >= 0),
  xp_total       int  not null default 0 check (xp_total >= 0),
  equipped       jsonb not null default '{}'::jsonb,  -- {frame:"item_id", skin:"item_id", title:"..."}
  parent_note    text,
  status         enroll_status not null default 'active',
  joined_at      date not null default current_date,
  left_at        date
);

create table parents_students (
  parent_id   uuid references users(id) on delete cascade,
  student_id  uuid references students(user_id) on delete cascade,
  is_primary  boolean not null default true,
  primary key (parent_id, student_id)
);
create index on parents_students (student_id);

-- -------------------------------------------------------- курсы и темы
create table courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  age_min     int,
  age_max     int,
  description text,
  is_active   boolean not null default true,
  sort_order  int not null default 0
);

create table modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  title       text not null,
  sort_order  int not null default 0
);
create index on modules (course_id, sort_order);

create table topics (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references modules(id) on delete cascade,
  title       text not null,
  description text,
  sort_order  int not null default 0
);
create index on topics (module_id, sort_order);

-- ---------------------------------------------------------------- группы
create table groups (
  id               uuid primary key default gen_random_uuid(),
  branch_id        uuid not null references branches(id),
  course_id        uuid not null references courses(id),
  teacher_id       uuid references users(id),
  name             text not null,
  room             text,
  capacity         int not null default 6 check (capacity between 1 and 30),
  status           group_status not null default 'active',
  current_topic_id uuid references topics(id),
  started_at       date not null default current_date,
  created_at       timestamptz not null default now()
);
create index on groups (status, teacher_id);
create index on groups (course_id);

-- Шаблон недели. weekday по ISO: 1=Пн ... 7=Вс
create table group_schedule (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references groups(id) on delete cascade,
  weekday       int  not null check (weekday between 1 and 7),
  start_time    time not null,
  duration_min  int  not null default 90,
  unique (group_id, weekday, start_time)
);

create table enrollments (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  student_id  uuid not null references students(user_id) on delete cascade,
  status      enroll_status not null default 'active',
  joined_at   date not null default current_date,
  left_at     date
);
create unique index enrollments_one_active on enrollments (student_id, group_id)
  where status = 'active';
create index on enrollments (group_id, status);

-- ---------------------------------------------------------------- уроки
create table lessons (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references groups(id) on delete cascade,
  scheduled_at  timestamptz not null,
  duration_min  int not null default 90,
  topic_id      uuid references topics(id),
  status        lesson_status not null default 'planned',
  cancel_reason text,
  cancelled_by_school boolean not null default false,
  completed_at  timestamptz,
  completed_by  uuid references users(id),
  created_at    timestamptz not null default now(),
  unique (group_id, scheduled_at)
);
create index on lessons (scheduled_at);
create index on lessons (group_id, scheduled_at desc);
create index lessons_open_idx on lessons (scheduled_at) where status = 'planned';

create table attendance (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  student_id  uuid not null references students(user_id) on delete cascade,
  status      attend_status not null,
  marked_at   timestamptz not null default now(),
  marked_by   uuid references users(id),
  unique (lesson_id, student_id)
);
create index on attendance (student_id, marked_at desc);

-- ------------------------------------------------------- коины и опыт
-- Append-only ledger. UPDATE/DELETE запрещены триггером.
create table coin_transactions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(user_id) on delete cascade,
  coins           int  not null,
  xp              int  not null default 0,
  reason_code     text not null,       -- attendance | punctual | homework | streak | manual | purchase | adjust ...
  reason_text     text,
  lesson_id       uuid references lessons(id) on delete set null,
  order_id        uuid,
  created_by      uuid references users(id),
  idempotency_key text not null unique,
  created_at      timestamptz not null default now()
);
create index on coin_transactions (student_id, created_at desc);
create index on coin_transactions (lesson_id) where lesson_id is not null;

create or replace function guard_append_only() returns trigger as $$
begin
  raise exception 'LEDGER_IMMUTABLE: % запрещён для %', tg_op, tg_table_name;
end $$ language plpgsql;

create trigger coin_tx_immutable before update or delete on coin_transactions
  for each row execute function guard_append_only();

-- --------------------------------------------------------------- магазин
create table shop_items (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid references branches(id),
  title       text not null,
  description text,
  image_url   text,
  kind        shop_kind not null default 'physical',
  price_coins int  not null check (price_coins > 0),
  cost_kzt    int  not null default 0,     -- себестоимость для отчёта админу
  stock       int,                          -- null = безлимит (виртуальные)
  is_active   boolean not null default true,
  sort_order  int not null default 0
);

create table orders (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(user_id) on delete cascade,
  item_id     uuid not null references shop_items(id),
  price_coins int  not null,
  status      order_status not null default 'pending',
  created_at  timestamptz not null default now(),
  issued_at   timestamptz,
  issued_by   uuid references users(id)
);
create index on orders (status, created_at);
create index on orders (student_id, created_at desc);

create table student_inventory (
  student_id  uuid references students(user_id) on delete cascade,
  item_id     uuid references shop_items(id),
  acquired_at timestamptz not null default now(),
  primary key (student_id, item_id)
);

-- -------------------------------------------------------------- домашки
create table homeworks (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  topic_id    uuid references topics(id),
  title       text not null,
  description text,
  link        text,
  attachments jsonb not null default '[]'::jsonb,
  deadline_at timestamptz,
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);
create index on homeworks (group_id, created_at desc);

create table submissions (
  id           uuid primary key default gen_random_uuid(),
  homework_id  uuid not null references homeworks(id) on delete cascade,
  student_id   uuid not null references students(user_id) on delete cascade,
  content      text,
  attachments  jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  was_on_time  boolean not null default true,
  status       submission_status not null default 'submitted',
  feedback     text,
  reviewed_at  timestamptz,
  reviewed_by  uuid references users(id),
  unique (homework_id, student_id)
);
create index on submissions (status, submitted_at);

-- ------------------------------------------------------- обратная связь
create table lesson_feedback (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  student_id  uuid references students(user_id) on delete cascade,
  kind        feedback_kind not null,
  text        text not null,
  can_be_public boolean not null default false,
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);
create index on lesson_feedback (student_id, created_at desc);
create index on lesson_feedback (lesson_id);

-- ---------------------------------------------------------------- ачивки
create table achievements (
  code        text primary key,
  title       text not null,
  description text not null,
  tier        achievement_tier not null default 'bronze',
  icon        text,
  is_hidden   boolean not null default false,
  reward_coins int not null default 0,
  sort_order  int not null default 0
);

create table student_achievements (
  student_id  uuid references students(user_id) on delete cascade,
  code        text references achievements(code) on delete cascade,
  earned_at   timestamptz not null default now(),
  primary key (student_id, code)
);

-- ---------------------------------------------------------------- оплаты
create table payments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(user_id) on delete cascade,
  amount_kzt    int  not null check (amount_kzt > 0),
  lessons_count int  not null check (lessons_count > 0),
  method        payment_method not null default 'kaspi',
  paid_at       date not null default current_date,
  period_label  text,
  comment       text,
  created_by    uuid references users(id),
  created_at    timestamptz not null default now()
);
create index on payments (student_id, paid_at desc);

-- ----------------------------------------------------------------- лиды
create table leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  child_age   int,
  course_slug text,
  comment     text,
  source      text,
  utm         jsonb not null default '{}'::jsonb,
  status      lead_status not null default 'new',
  created_at  timestamptz not null default now()
);
create index on leads (status, created_at desc);

-- --------------------------------------------------------- уведомления
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid references users(id) on delete cascade,
  phone         text not null,
  template_code text not null,
  payload       jsonb not null default '{}'::jsonb,
  body          text not null,
  status        notify_status not null default 'queued',
  attempts      int not null default 0,
  error         text,
  dedupe_key    text unique,
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index on notifications (status, created_at);

-- ------------------------------------------------------------- OTP-коды
create table otp_codes (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code_hash   text not null,
  attempts    int not null default 0,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);
create index on otp_codes (phone, created_at desc);

-- ------------------------------------------------------------ аудит-лог
create table audit_log (
  id         bigserial primary key,
  actor_id   uuid references users(id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  uuid,
  diff       jsonb,
  ip         text,
  created_at timestamptz not null default now()
);
create index on audit_log (entity, entity_id, created_at desc);
create index on audit_log (actor_id, created_at desc);

-- ------------------------------------------------------------------ RLS
-- Бэкенд ходит с сервисной ролью и сам проверяет права.
-- RLS включаем без политик, чтобы anon/authenticated ключи не читали ничего,
-- даже если они где-то утекут во фронтенд.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
