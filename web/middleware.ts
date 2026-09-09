import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_TOKEN, COOKIE_ROLE, ROLE_HOME, type Role } from '@/lib/session';

/**
 * Это UX-редирект, не граница безопасности — реальные права на каждый запрос
 * проверяет бэкенд (app.auth в src/app.ts). Здесь просто не пускаем в чужой кабинет.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_TOKEN)?.value;
  const role = req.cookies.get(COOKIE_ROLE)?.value as Role | undefined;

  if (pathname.startsWith('/app')) {
    if (!token || !role) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    if (!pathname.startsWith(ROLE_HOME[role])) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
  }

  if (pathname === '/login' && token && role) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login'],
};
