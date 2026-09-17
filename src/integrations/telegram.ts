import { query } from '../db.js';
import { config } from '../config.js';

/**
 * Тот же паттерн очереди, что и у WhatsApp (whatsapp.ts): пишем в notifications
 * с dedupe_key, реальная отправка — отдельным шагом. У Telegram получателя-
 * персоны нет, шлём в фиксированный chat_id (группа персонала), поэтому phone
 * не используется — canal='telegram' отличает такие записи при обработке.
 */
export async function enqueueTelegramNotification(params: {
  body: string;
  dedupeKey?: string;
  payload?: Record<string, unknown>;
}) {
  const chatId = config.TELEGRAM_CHAT_ID;
  if (!chatId) return;
  await query(
    `insert into notifications (channel, chat_id, template_code, body, payload, dedupe_key)
     values ('telegram', $1, 'staff_reminder', $2, $3, $4)
     on conflict (dedupe_key) do nothing`,
    [chatId, params.body, JSON.stringify(params.payload ?? {}), params.dedupeKey ?? null]);
}

async function sendViaTelegram(chatId: string, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    throw new Error(`Telegram API ${res.status}: ${await res.text()}`);
  }
}

/**
 * Обработчик очереди Telegram. Запускается cron'ом каждую минуту, вместе с WhatsApp.
 * Сознательно НЕ проверяет config.NOTIFICATIONS_ENABLED — этот флаг относится к
 * WhatsApp-рассылке (Green API), которая в проде выключена независимо от Telegram.
 * Единственный переключатель здесь — наличие TELEGRAM_BOT_TOKEN.
 */
export async function flushTelegramNotifications(limit = 20) {
  if (!config.TELEGRAM_BOT_TOKEN) return { skipped: true };

  const batch = await query<{ id: string; chat_id: string; body: string; attempts: number }>(
    `select id, chat_id, body, attempts from notifications
      where status = 'queued' and channel = 'telegram' and attempts < 3
      order by created_at limit $1`, [limit]);

  let sent = 0;
  for (const n of batch) {
    try {
      await sendViaTelegram(n.chat_id, n.body);
      await query(`update notifications set status='sent', sent_at=now() where id=$1`, [n.id]);
      sent++;
    } catch (e: any) {
      const failed = n.attempts + 1 >= 3;
      await query(
        `update notifications set attempts = attempts + 1, error = $2,
                status = case when $3 then 'failed'::notify_status else status end
          where id = $1`, [n.id, String(e?.message ?? e).slice(0, 500), failed]);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return { sent, total: batch.length };
}
