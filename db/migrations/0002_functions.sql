-- =====================================================================
-- Функции и представления
-- =====================================================================

-- ---------------------------------------------------------------------
-- apply_coins — ЕДИНСТВЕННЫЙ способ изменить баланс коинов и XP.
-- Гарантирует: идемпотентность, отсутствие минуса, атомарность.
-- Приложение никогда не пишет в coin_transactions напрямую.
-- ---------------------------------------------------------------------
create or replace function apply_coins(
  p_student     uuid,
  p_coins       int,
  p_xp          int,
  p_reason_code text,
  p_reason_text text default null,
  p_lesson      uuid default null,
  p_order       uuid default null,
  p_actor       uuid default null,
  p_idem        text default null
) returns coin_transactions
language plpgsql
as $$
declare
  v_tx      coin_transactions;
  v_balance int;
  v_idem    text := coalesce(p_idem, gen_random_uuid()::text);
begin
  select * into v_tx from coin_transactions where idempotency_key = v_idem;
  if found then
    return v_tx;                       -- повторный вызов — возвращаем старую запись
  end if;

  select coins_balance into v_balance
    from students where user_id = p_student
    for update;

  if not found then
    raise exception 'STUDENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_balance + p_coins < 0 then
    raise exception 'INSUFFICIENT_COINS' using errcode = 'P0001';
  end if;

  begin
    insert into coin_transactions
      (student_id, coins, xp, reason_code, reason_text, lesson_id, order_id, created_by, idempotency_key)
    values
      (p_student, p_coins, greatest(p_xp, 0), p_reason_code, p_reason_text, p_lesson, p_order, p_actor, v_idem)
    returning * into v_tx;
  exception when unique_violation then
    select * into v_tx from coin_transactions where idempotency_key = v_idem;
    return v_tx;
  end;

  update students
     set coins_balance = coins_balance + p_coins,
         xp_total      = xp_total + greatest(p_xp, 0)
   where user_id = p_student;

  return v_tx;
end $$;

-- ---------------------------------------------------------------------
-- generate_lessons — раскатывает шаблон недели в конкретные уроки.
-- Идемпотентна: unique(group_id, scheduled_at) + on conflict do nothing.
-- Запускается cron'ом раз в сутки на горизонт p_days.
-- ---------------------------------------------------------------------
create or replace function generate_lessons(p_days int default 14)
returns int
language plpgsql
as $$
declare v_count int;
begin
  with cal as (
    select d::date as day
      from generate_series(current_date, current_date + p_days, interval '1 day') d
  ),
  planned as (
    select g.id  as group_id,
           ((cal.day + gs.start_time) at time zone coalesce(b.timezone, 'Asia/Almaty')) as scheduled_at,
           gs.duration_min
      from groups g
      join branches b       on b.id = g.branch_id
      join group_schedule gs on gs.group_id = g.id
      join cal on extract(isodow from cal.day)::int = gs.weekday
     where g.status = 'active'
  ),
  ins as (
    insert into lessons (group_id, scheduled_at, duration_min)
    select group_id, scheduled_at, duration_min from planned
    where scheduled_at > now()
    on conflict (group_id, scheduled_at) do nothing
    returning 1
  )
  select count(*) into v_count from ins;
  return v_count;
end $$;

-- ---------------------------------------------------------------------
-- Баланс уроков по абонементу.
-- Правило: урок списывается при статусе present / late / absent (прогул).
-- Не списывается: excused (болел, предупредили) и отменённые школой уроки.
-- ---------------------------------------------------------------------
create or replace view v_lesson_balance as
select s.user_id as student_id,
       coalesce(p.paid, 0)  as lessons_paid,
       coalesce(u.used, 0)  as lessons_used,
       coalesce(p.paid, 0) - coalesce(u.used, 0) as lessons_left
  from students s
  left join (
    select student_id, sum(lessons_count) as paid
      from payments group by student_id
  ) p on p.student_id = s.user_id
  left join (
    select a.student_id, count(*) as used
      from attendance a
      join lessons l on l.id = a.lesson_id
     where a.status in ('present','late','absent')
       and l.status = 'completed'
     group by a.student_id
  ) u on u.student_id = s.user_id;

-- ---------------------------------------------------------------------
-- Ученики в зоне риска: 2+ пропуска подряд среди последних уроков.
-- ---------------------------------------------------------------------
create or replace view v_at_risk as
with marked as (
  select a.student_id,
         a.status,
         l.scheduled_at,
         row_number() over (partition by a.student_id order by l.scheduled_at desc) as rn
    from attendance a
    join lessons l on l.id = a.lesson_id
   where l.status = 'completed'
),
last3 as (
  select student_id,
         count(*) filter (where status in ('absent','excused') and rn <= 2) as miss_last2,
         count(*) filter (where status in ('absent','excused') and rn <= 3) as miss_last3,
         max(scheduled_at) as last_lesson_at
    from marked where rn <= 3
   group by student_id
)
select u.id as student_id,
       u.full_name,
       l3.miss_last2,
       l3.miss_last3,
       l3.last_lesson_at,
       case when l3.miss_last3 >= 3 then 'critical'
            when l3.miss_last2 >= 2 then 'warning'
            else 'ok' end as risk_level
  from last3 l3
  join users u on u.id = l3.student_id
 where u.is_active
   and l3.miss_last2 >= 2;

-- ---------------------------------------------------------------------
-- Ручные коины преподавателя в разрезе урока (для лимита 30 на группу).
-- ---------------------------------------------------------------------
create or replace view v_manual_coins_per_lesson as
select lesson_id, sum(coins) as manual_coins
  from coin_transactions
 where reason_code = 'manual' and lesson_id is not null
 group by lesson_id;
