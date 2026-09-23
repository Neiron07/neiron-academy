-- =====================================================================
-- Оптимизация под рост числа учеников и историю уроков/посещений:
-- 1) составной индекс под запросы «завершённые уроки после даты X»
--    (v_lesson_balance, v_at_risk, дашборд) — раньше это были full scan'ы
--    по мере накопления истории;
-- 2) v_at_risk считал оконную функцию по ВСЕЙ истории посещений каждого
--    ученика, хотя нужны только последние 3 урока — с годами истории это
--    станет главным тормозом дашборда. Ограничиваем окно 120 днями: для
--    любого активно занимающегося ученика (минимум раз в 1-2 недели)
--    последние 3 урока гарантированно попадают в это окно.
-- =====================================================================

create index if not exists lessons_status_scheduled_idx on lessons (status, scheduled_at);

create or replace view v_at_risk as
with marked as (
  select a.student_id,
         a.status,
         l.scheduled_at,
         row_number() over (partition by a.student_id order by l.scheduled_at desc) as rn
    from attendance a
    join lessons l on l.id = a.lesson_id
   where l.status = 'completed'
     and l.scheduled_at > now() - interval '120 days'
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
