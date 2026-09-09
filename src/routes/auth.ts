import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, query } from '../db.js';
import { AppError } from '../lib/errors.js';
import {
  assertNotLocked, generateOtp, hash, normalizePhone, registerFailedAttempt,
  resetAttempts, signToken, verifyHash, Role,
} from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import { enqueueNotification } from '../integrations/whatsapp.js';
import { levelFromXp } from '../lib/rules.js';

interface UserRow {
  id: string; role: Role; full_name: string; token_version: number;
  password_hash: string | null; pin_hash: string | null;
  is_active: boolean; locked_until: string | null;
}

export default async function authRoutes(app: FastifyInstance) {
  // ------------------------------------------------- вход сотрудника
  app.post('/staff/login', { config: { rateLimit: { max: 10, timeWindow: '5 minutes' } } },
    async (req) => {
      const body = z.object({ phone: z.string(), password: z.string().min(6) }).parse(req.body);
      const phone = normalizePhone(body.phone);

      const user = await one<UserRow>(
        `select * from users where phone = $1 and role in ('admin','teacher')`, [phone]);
      if (!user) throw new AppError(401, 'BAD_CREDENTIALS', 'Неверный телефон или пароль');

      assertNotLocked(user);

      const ok = user.password_hash && (await verifyHash(user.password_hash, body.password));
      if (!ok) {
        await registerFailedAttempt(user.id);
        throw new AppError(401, 'BAD_CREDENTIALS', 'Неверный телефон или пароль');
      }

      await resetAttempts(user.id);
      await audit({ actorId: user.id, action: 'login.staff', ip: req.ip });
      return { token: signToken(user), user: publicUser(user) };
    });

  // ---------------------------------------------------- вход ученика
  app.post('/student/login', { config: { rateLimit: { max: 10, timeWindow: '5 minutes' } } },
    async (req) => {
      const body = z.object({
        login: z.string().min(2).max(40),
        pin: z.string().regex(/^\d{4}$/, 'PIN — это 4 цифры'),
      }).parse(req.body);

      const login = body.login.trim().toLowerCase();
      const user = await one<UserRow>(
        `select * from users where login = $1 and role = 'student'`, [login]);
      if (!user) throw new AppError(401, 'BAD_CREDENTIALS', 'Неверный логин или PIN');

      assertNotLocked(user);

      const ok = user.pin_hash && (await verifyHash(user.pin_hash, body.pin));
      if (!ok) {
        await registerFailedAttempt(user.id);
        throw new AppError(401, 'BAD_CREDENTIALS', 'Неверный логин или PIN');
      }

      await resetAttempts(user.id);
      return { token: signToken(user), user: publicUser(user) };
    });

  // ---------------------------------------------------- вход родителя по PIN
  app.post('/parent/login', { config: { rateLimit: { max: 10, timeWindow: '5 minutes' } } },
    async (req) => {
      const body = z.object({
        phone: z.string(),
        pin: z.string().regex(/^\d{4}$/, 'PIN — это 4 цифры'),
      }).parse(req.body);

      const phone = normalizePhone(body.phone);
      const user = await one<UserRow>(
        `select * from users where phone = $1 and role = 'parent'`, [phone]);
      if (!user) throw new AppError(401, 'BAD_CREDENTIALS', 'Неверный телефон или PIN');

      assertNotLocked(user);

      const ok = user.pin_hash && (await verifyHash(user.pin_hash, body.pin));
      if (!ok) {
        await registerFailedAttempt(user.id);
        throw new AppError(401, 'BAD_CREDENTIALS', 'Неверный телефон или PIN');
      }

      await resetAttempts(user.id);
      await audit({ actorId: user.id, action: 'login.parent', ip: req.ip });
      return { token: signToken(user), user: publicUser(user) };
    });

  // ------------------------------------- вход родителя: запрос кода (устаревший способ, оставлен на всякий случай)
  app.post('/parent/request-code', { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } },
    async (req) => {
      const body = z.object({ phone: z.string() }).parse(req.body);
      const phone = normalizePhone(body.phone);

      const user = await one<UserRow>(
        `select * from users where phone = $1 and role = 'parent' and is_active`, [phone]);

      // Не подтверждаем существование номера — защита от перебора базы родителей.
      if (user) {
        const code = generateOtp();
        await query(
          `insert into otp_codes (phone, code_hash, expires_at)
           values ($1, $2, now() + interval '10 minutes')`,
          [phone, await hash(code)],
        );
        await enqueueNotification({
          recipientId: user.id,
          phone,
          templateCode: 'otp',
          body: `Neiron Academy\nВаш код для входа: ${code}\nДействует 10 минут.`,
          dedupeKey: `otp:${phone}:${Date.now()}`,
        });
      }
      return { sent: true, message: 'Если номер зарегистрирован, код придёт в WhatsApp' };
    });

  // ------------------------------------- вход родителя: проверка кода
  app.post('/parent/verify', { config: { rateLimit: { max: 10, timeWindow: '10 minutes' } } },
    async (req) => {
      const body = z.object({
        phone: z.string(),
        code: z.string().regex(/^\d{6}$/),
      }).parse(req.body);
      const phone = normalizePhone(body.phone);

      const otp = await one<{ id: string; code_hash: string; attempts: number }>(
        `select id, code_hash, attempts from otp_codes
          where phone = $1 and consumed_at is null and expires_at > now()
          order by created_at desc limit 1`, [phone]);
      if (!otp) throw new AppError(400, 'CODE_EXPIRED', 'Код истёк, запросите новый');
      if (otp.attempts >= 5) throw new AppError(429, 'TOO_MANY', 'Слишком много попыток');

      const ok = await verifyHash(otp.code_hash, body.code);
      if (!ok) {
        await query(`update otp_codes set attempts = attempts + 1 where id = $1`, [otp.id]);
        throw new AppError(401, 'BAD_CODE', 'Неверный код');
      }

      await query(`update otp_codes set consumed_at = now() where id = $1`, [otp.id]);

      const user = await one<UserRow>(
        `select * from users where phone = $1 and role = 'parent'`, [phone]);
      if (!user) throw new AppError(401, 'NO_USER', 'Пользователь не найден');

      assertNotLocked(user);
      await resetAttempts(user.id);
      await audit({ actorId: user.id, action: 'login.parent', ip: req.ip });
      return { token: signToken(user), user: publicUser(user) };
    });

  // ---------------------------------------------------------- профиль
  app.get('/me', { preHandler: app.auth(['admin', 'teacher', 'student', 'parent']) },
    async (req) => {
      const u = req.user!;
      const base = { id: u.id, role: u.role, full_name: u.full_name };

      if (u.role === 'student') {
        const s = await one<{ coins_balance: number; xp_total: number }>(
          `select coins_balance, xp_total from students where user_id = $1`, [u.id]);
        return { ...base, coins: s?.coins_balance ?? 0, ...levelFromXp(s?.xp_total ?? 0) };
      }
      if (u.role === 'parent') {
        const children = await query(
          `select u.id, u.full_name from parents_students ps
             join users u on u.id = ps.student_id
            where ps.parent_id = $1 and u.is_active
            order by u.full_name`, [u.id]);
        return { ...base, children };
      }
      return base;
    });

  // ------------------------------------------------------------ выход
  app.post('/logout', { preHandler: app.auth(['admin', 'teacher', 'student', 'parent']) },
    async (req) => {
      // token_version++ убивает все активные сессии этого пользователя
      await query(`update users set token_version = token_version + 1 where id = $1`, [req.user!.id]);
      return { ok: true };
    });
}

function publicUser(u: UserRow) {
  return { id: u.id, role: u.role, full_name: u.full_name };
}
