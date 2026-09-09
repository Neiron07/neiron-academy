import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config, TOKEN_TTL } from '../config.js';
import { one, query } from '../db.js';
import { AppError } from './errors.js';

export type Role = 'admin' | 'teacher' | 'student' | 'parent';

export interface AuthUser {
  id: string;
  role: Role;
  full_name: string;
  token_version: number;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  tv: number;
}

// ------------------------------------------------------------- хеши
export const hash = (v: string) => argon2.hash(v, { type: argon2.argon2id });
export const verifyHash = (h: string, v: string) =>
  argon2.verify(h, v).catch(() => false);

// ------------------------------------------------------------- токены
export function signToken(user: { id: string; role: Role; token_version: number }) {
  return jwt.sign(
    { sub: user.id, role: user.role, tv: user.token_version } satisfies JwtPayload,
    config.JWT_SECRET,
    { expiresIn: TOKEN_TTL[user.role] ?? 7 * 24 * 3600 },
  );
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Сессия истекла, войдите заново');
  }
}

// ------------------------------------------------------------ телефон
/** Приводит казахстанский номер к виду 77011234567. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  if (digits.length === 10) return '7' + digits;
  if (digits.length === 11 && digits.startsWith('7')) return digits;
  throw new AppError(400, 'BAD_PHONE', 'Неверный формат номера телефона');
}

// -------------------------------------------------------------- логин
const TRANSLIT: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
  н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',
  ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',ә:'a',ғ:'g',қ:'q',ң:'n',ө:'o',ұ:'u',ү:'u',һ:'h',і:'i',
};

function translit(s: string) {
  return s.toLowerCase().split('').map((c) => TRANSLIT[c] ?? c).join('').replace(/[^a-z0-9]/g, '');
}

/**
 * Логин ученика: имя + 2 цифры года рождения (aisultan12).
 * При коллизии добавляет суффикс. Логин печатается на карточке и выдаётся ребёнку.
 */
export async function generateLogin(fullName: string, birthYear?: number): Promise<string> {
  const first = translit(fullName.trim().split(/\s+/)[0] ?? 'user').slice(0, 12) || 'user';
  const suffix = birthYear ? String(birthYear).slice(-2) : '';
  const base = `${first}${suffix}`;

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}${i}`;
    const exists = await one('select 1 from users where login = $1', [candidate]);
    if (!exists) return candidate;
  }
  return `${base}${crypto.randomInt(1000, 9999)}`;
}

/** 4-значный PIN, без ведущего нуля и без совсем очевидных комбинаций. */
export function generatePin(): string {
  const banned = new Set(['1111','1234','0000','1212','2222','4321','9999']);
  for (;;) {
    const pin = String(crypto.randomInt(1000, 10000));
    if (!banned.has(pin)) return pin;
  }
}

// ---------------------------------------------------------------- OTP
export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

/** Блокировка после 5 неудачных попыток на 15 минут. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export async function registerFailedAttempt(userId: string) {
  await query(
    `update users
        set failed_attempts = failed_attempts + 1,
            locked_until = case when failed_attempts + 1 >= $2
                                then now() + ($3 || ' minutes')::interval
                                else locked_until end
      where id = $1`,
    [userId, MAX_FAILED_ATTEMPTS, LOCK_MINUTES],
  );
}

export async function resetAttempts(userId: string) {
  await query(
    `update users set failed_attempts = 0, locked_until = null, last_login_at = now() where id = $1`,
    [userId],
  );
}

export function assertNotLocked(user: { locked_until: string | null; is_active: boolean }) {
  if (!user.is_active) {
    throw new AppError(403, 'USER_DISABLED', 'Доступ отключён. Обратитесь в школу.');
  }
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new AppError(429, 'LOCKED', `Слишком много попыток. Попробуйте через ${LOCK_MINUTES} минут.`);
  }
}
