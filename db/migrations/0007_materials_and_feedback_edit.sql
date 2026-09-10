-- =====================================================================
-- Материалы к уроку/группе — то, что преподаватель прикладывает ученикам
-- (ссылка, файл, заметка), не привязано к конкретному занятию жёстко.
-- =====================================================================

create table materials (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  lesson_id   uuid references lessons(id) on delete set null,
  title       text not null,
  description text,
  url         text,
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);
create index on materials (group_id, created_at desc);

-- ---------------------------------------------------------------------
-- Обратная связь должна быть РЕДАКТИРУЕМОЙ, а не журналом дублей: повторная
-- отправка формы по тому же уроку должна заменять запись, а не плодить новые.
-- Два случая: персональная (highlight/attention, привязана к ученику) и
-- общая по группе (group_note, student_id пуст — NULL не ловится обычным
-- unique, поэтому отдельный частичный индекс).
-- ---------------------------------------------------------------------
create unique index lesson_feedback_group_note_uq
  on lesson_feedback (lesson_id)
  where kind = 'group_note';

create unique index lesson_feedback_student_uq
  on lesson_feedback (lesson_id, student_id, kind)
  where student_id is not null;
