import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { config } from './config.js';
import { one } from './db.js';
import { AppError, mapPgError } from './lib/errors.js';
import { Role, verifyToken } from './lib/auth.js';

import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import teacherRoutes from './routes/teacher.js';
import lessonRoutes from './routes/lessons.js';
import studentRoutes from './routes/student.js';
import shopRoutes from './routes/shop.js';
import homeworkRoutes from './routes/homework.js';
import parentRoutes from './routes/parent.js';
import adminRoutes from './routes/admin.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; role: Role; full_name: string };
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } }
        : true,
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: [config.APP_URL], credentials: true });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  /**
   * Fastify по умолчанию падает на пустом теле с Content-Type: application/json
   * (FST_ERR_CTP_EMPTY_JSON_BODY) — ещё до того, как запрос дойдёт до роута.
   * Многие POST-ручки без данных (сброс PIN и т.п.) шлют именно так через наш
   * прокси. Пустое тело — это просто {}, а не ошибка.
   */
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    const text = body as string;
    if (text.trim() === '') return done(null, {});
    try {
      done(null, JSON.parse(text));
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  // ------------------------------------------------------ авторизация
  /**
   * Проверка роли на КАЖДОМ запросе, а не только редиректом во фронте.
   * Ученик, вбивший /admin/dashboard руками, получает 403.
   */
  app.decorate('auth', (roles: Role[]) => {
    return async (req: FastifyRequest, _reply: FastifyReply) => {
      const header = req.headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) throw new AppError(401, 'NO_TOKEN', 'Требуется вход');

      const payload = verifyToken(token);
      const user = await one<{
        id: string; role: Role; full_name: string; token_version: number; is_active: boolean;
      }>(`select id, role, full_name, token_version, is_active from users where id = $1`, [payload.sub]);

      if (!user || !user.is_active) throw new AppError(401, 'NO_USER', 'Пользователь не найден');
      if (user.token_version !== payload.tv) {
        throw new AppError(401, 'TOKEN_REVOKED', 'Сессия завершена, войдите заново');
      }
      if (!roles.includes(user.role)) throw new AppError(403, 'FORBIDDEN', 'Недостаточно прав');

      req.user = { id: user.id, role: user.role, full_name: user.full_name };
    };
  });

  // --------------------------------------------------- обработка ошибок
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send({ error: err.code, message: err.message, details: err.details });
    }
    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Проверьте введённые данные',
        details: err.flatten().fieldErrors,
      });
    }
    const mapped = mapPgError(err);
    if (mapped) {
      return reply.status(mapped.status).send({ error: mapped.code, message: mapped.message });
    }
    req.log.error(err);
    return reply.status(500).send({ error: 'INTERNAL', message: 'Внутренняя ошибка сервера' });
  });

  // ------------------------------------------------------------ роуты
  app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }));

  await app.register(publicRoutes,   { prefix: '/api/public' });
  await app.register(authRoutes,     { prefix: '/api/auth' });
  await app.register(teacherRoutes,  { prefix: '/api/teacher' });
  await app.register(lessonRoutes,   { prefix: '/api/lessons' });
  await app.register(studentRoutes,  { prefix: '/api/me' });
  await app.register(shopRoutes,     { prefix: '/api/shop' });
  await app.register(homeworkRoutes, { prefix: '/api/homework' });
  await app.register(parentRoutes,   { prefix: '/api/parent' });
  await app.register(adminRoutes,    { prefix: '/api/admin' });

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    auth: (roles: Role[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
