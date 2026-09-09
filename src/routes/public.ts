import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query } from '../db.js';
import { normalizePhone } from '../lib/auth.js';
import { enqueueNotification } from '../integrations/whatsapp.js';
import { config } from '../config.js';

/** Публичные ручки лендинга. Без авторизации, но с жёстким rate limit. */
export default async function publicRoutes(app: FastifyInstance) {
  app.get('/courses', async () =>
    query(`select id, name, slug, age_min, age_max, description
             from courses where is_active order by sort_order`));

  app.post('/leads', { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } },
    async (req) => {
      const body = z.object({
        name: z.string().min(2).max(100),
        phone: z.string(),
        child_age: z.number().int().min(4).max(18).optional(),
        course_slug: z.string().optional(),
        comment: z.string().max(500).optional(),
        source: z.string().max(50).optional(),
        utm: z.record(z.string()).default({}),
      }).parse(req.body);

      const phone = normalizePhone(body.phone);

      const lead = await one<{ id: string }>(
        `insert into leads (name, phone, child_age, course_slug, comment, source, utm)
         values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [body.name, phone, body.child_age ?? null, body.course_slug ?? null,
         body.comment ?? null, body.source ?? 'landing', JSON.stringify(body.utm)]);

      // Мгновенное уведомление в WhatsApp — скорость ответа решает конверсию.
      if (config.ADMIN_NOTIFY_PHONE) {
        await enqueueNotification({
          phone: config.ADMIN_NOTIFY_PHONE,
          templateCode: 'new_lead',
          body: `🔔 Новая заявка\nИмя: ${body.name}\nТелефон: +${phone}\n`
              + `Возраст: ${body.child_age ?? '—'}\nКурс: ${body.course_slug ?? '—'}\n`
              + `Источник: ${body.source ?? 'landing'}`,
          dedupeKey: `lead:${lead!.id}`,
        });
      }

      return { ok: true, message: 'Заявка принята. Мы свяжемся с вами в ближайшее время.' };
    });
}
