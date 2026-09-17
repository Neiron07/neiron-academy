-- =====================================================================
-- Telegram-канал для очереди уведомлений (напоминания персоналу о
-- пробных уроках/событиях и обычных уроках за ~час до начала).
-- Расширяем существующую таблицу notifications вместо отдельной —
-- получаем retry/attempts/dedupe_key бесплатно, тем же паттерном, что
-- и у WhatsApp-очереди. phone был обязателен только для WhatsApp,
-- у Telegram получателя-персоны нет — шлём в фиксированный chat_id.
-- =====================================================================

alter table notifications add column if not exists channel text not null default 'whatsapp'
  check (channel in ('whatsapp', 'telegram'));
alter table notifications add column if not exists chat_id text;
alter table notifications alter column phone drop not null;
