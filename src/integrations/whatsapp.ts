import { one, query } from '../db.js';
import { config } from '../config.js';

/**
 * Уведомления пишутся в очередь в БД, а не отправляются синхронно.
 * Плюсы: запрос пользователя не ждёт внешний API, падение Green API
 * не ломает урок, dedupe_key защищает от дублей при ретраях.
 */
export async function enqueueNotification(params: {
  recipientId?: string;
  phone: string;
  templateCode: string;
  body: string;
  payload?: Record<string, unknown>;
  dedupeKey?: string;
}) {
  await query(
    `insert into notifications (recipient_id, phone, template_code, body, payload, dedupe_key)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (dedupe_key) do nothing`,
    [
      params.recipientId ?? null,
      params.phone,
      params.templateCode,
      params.body,
      JSON.stringify(params.payload ?? {}),
      params.dedupeKey ?? null,
    ],
  );
}

async function sendViaGreenApi(phone: string, text: string): Promise<void> {
  const url = `https://api.green-api.com/waInstance${config.GREEN_API_ID}`
            + `/sendMessage/${config.GREEN_API_TOKEN}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: `${phone}@c.us`, message: text }),
  });

  if (!res.ok) {
    throw new Error(`Green API ${res.status}: ${await res.text()}`);
  }
}

/** Обработчик очереди. Запускается cron'ом каждую минуту. */
export async function flushNotifications(limit = 20) {
  if (!config.NOTIFICATIONS_ENABLED || !config.GREEN_API_ID) return { skipped: true };

  const batch = await query<{ id: string; phone: string; body: string; attempts: number }>(
    `select id, phone, body, attempts from notifications
      where status = 'queued' and attempts < 3
      order by created_at limit $1`, [limit]);

  let sent = 0;
  for (const n of batch) {
    try {
      await sendViaGreenApi(n.phone, n.body);
      await query(`update notifications set status='sent', sent_at=now() where id=$1`, [n.id]);
      sent++;
    } catch (e: any) {
      const failed = n.attempts + 1 >= 3;
      await query(
        `update notifications set attempts = attempts + 1, error = $2,
                status = case when $3 then 'failed'::notify_status else status end
          where id = $1`, [n.id, String(e?.message ?? e).slice(0, 500), failed]);
    }
    await new Promise((r) => setTimeout(r, 1200));   // не долбим API
  }
  return { sent, total: batch.length };
}
