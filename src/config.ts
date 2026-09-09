import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  APP_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET должен быть не короче 32 символов'),
  BRANCH_ID: z.string().uuid(),
  TZ: z.string().default('Asia/Almaty'),
  GREEN_API_ID: z.string().optional(),
  GREEN_API_TOKEN: z.string().optional(),
  ADMIN_NOTIFY_PHONE: z.string().optional(),
  NOTIFICATIONS_ENABLED: z.coerce.boolean().default(false),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Ошибка конфигурации:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

/** Срок жизни токена по ролям (сек). Дети не должны вводить PIN каждый день. */
export const TOKEN_TTL: Record<string, number> = {
  student: 90 * 24 * 3600,
  parent: 30 * 24 * 3600,
  teacher: 7 * 24 * 3600,
  admin: 7 * 24 * 3600,
};
