-- =====================================================================
-- Реферальная система: кто из учеников пришёл по приглашению родителя.
-- Считается «приведённым другом» с первой оплаты — до этого это просто
-- потенциальный клиент, ничем не подтверждённый.
-- =====================================================================

alter table students
  add column referred_by_parent_id uuid references users(id) on delete set null;

create index on students (referred_by_parent_id) where referred_by_parent_id is not null;
