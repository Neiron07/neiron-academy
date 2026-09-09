-- =====================================================================
-- Единая вьюха с платёжной картиной ученика — переиспользуется в списке
-- учеников и на дашборде вместо дублирования одних и тех же подзапросов.
-- =====================================================================

create or replace view v_student_payment_status as
select s.user_id as student_id,
       pay.total_paid,
       pay.last_payment_at,
       pay.last_payment_amount,
       lb.lessons_left,
       wk.weekly_lessons
  from students s
  left join v_lesson_balance lb on lb.student_id = s.user_id
  left join (
    select e2.student_id, count(gs.id)::int as weekly_lessons
      from enrollments e2
      join group_schedule gs on gs.group_id = e2.group_id
     where e2.status = 'active'
     group by e2.student_id
  ) wk on wk.student_id = s.user_id
  left join (
    select student_id,
           sum(amount_kzt)::int as total_paid,
           max(paid_at) as last_payment_at,
           (array_agg(amount_kzt order by paid_at desc))[1] as last_payment_amount
      from payments
     group by student_id
  ) pay on pay.student_id = s.user_id;
