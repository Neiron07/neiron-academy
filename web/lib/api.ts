/** Клиентский доступ к бэкенду через наш прокси. Токен нигде здесь не виден — он в httpOnly-куке. */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const AUTH_FAILURE_CODES = new Set(['TOKEN_REVOKED', 'NO_TOKEN', 'NO_USER', 'INVALID_TOKEN']);

/**
 * Кука с токеном httpOnly — из браузера её не стереть. Если её не стереть на сервере,
 * middleware после редиректа на /login тут же отправит обратно в /app/<role> по одному
 * факту наличия куки — страница будет бесконечно "мигать" между /login и кабинетом.
 */
let clearingSession = false;
async function clearSessionAndRedirect() {
  if (typeof window === 'undefined' || clearingSession) return;
  clearingSession = true;
  try {
    await fetch('/api/proxy/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // если и это не прошло — всё равно уходим на /login, хуже не будет
  } finally {
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include',
    cache: 'no-store',
  });

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const code = data?.error ?? 'UNKNOWN';
    if (AUTH_FAILURE_CODES.has(code)) {
      void clearSessionAndRedirect();
    }
    throw new ApiError(res.status, code, data?.message ?? 'Что-то пошло не так. Попробуйте ещё раз.', data?.details);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
