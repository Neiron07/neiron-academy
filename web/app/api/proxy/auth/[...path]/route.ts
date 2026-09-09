import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { COOKIE_TOKEN, COOKIE_ROLE, TOKEN_TTL, type Role } from '@/lib/session';

/**
 * Единственное место, где JWT бэкенда касается сервера Next. Наружу токен
 * никогда не уходит — только httpOnly-кука и профиль пользователя.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const subpath = path.join('/');
  const isLogout = subpath === 'logout';

  // Логаут — особый случай: локальная сессия должна закрыться, даже если токен уже
  // невалиден и звонок в бэкенд падает с 401. Иначе бракованная кука не даёт себя стереть,
  // а middleware бесконечно отскакивает /login <-> /app/<role> ("страница обновляется и ничего не видно").
  if (isLogout) {
    const token = req.cookies.get(COOKIE_TOKEN)?.value;
    if (token) {
      await backendFetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: '{}',
      }).catch(() => null);
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(COOKIE_TOKEN);
    res.cookies.delete(COOKIE_ROLE);
    return res;
  }

  const body = await req.text();
  const upstream = await backendFetch(`/api/auth/${subpath}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const res = NextResponse.json(data.token ? { user: data.user } : data);

  if (data.token && data.user) {
    const secure = process.env.NODE_ENV === 'production';
    const maxAge = TOKEN_TTL[data.user.role as Role] ?? 7 * 24 * 3600;
    res.cookies.set(COOKIE_TOKEN, data.token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge });
    res.cookies.set(COOKIE_ROLE, data.user.role, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge });
  }

  return res;
}
