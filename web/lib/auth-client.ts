import { ApiError } from './api';
import type { PublicUser } from './session';

async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/proxy/auth/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? 'UNKNOWN', data.message ?? 'Не удалось выполнить вход', data.details);
  }
  return data as T;
}

export const authApi = {
  loginStudent: (login: string, pin: string) =>
    authRequest<{ user: PublicUser }>('student/login', { login, pin }),
  loginParent: (phone: string, pin: string) =>
    authRequest<{ user: PublicUser }>('parent/login', { phone, pin }),
  loginStaff: (phone: string, password: string) =>
    authRequest<{ user: PublicUser }>('staff/login', { phone, password }),
  logout: () => authRequest<{ ok: boolean }>('logout'),
};
