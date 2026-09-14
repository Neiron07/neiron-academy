'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import { useLogout } from '@/lib/use-logout';

export interface StaffNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

function NavLinks({ nav, pathname, onNavigate }: { nav: StaffNavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? 'bg-purple text-white' : 'text-lavender hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Общий каркас бокового меню для кабинетов персонала (админ, маркетолог) — гамбургер на мобиле, постоянный сайдбар на десктопе. */
export function StaffSidebar({ title, nav }: { title: string; nav: StaffNavItem[] }) {
  const pathname = usePathname();
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-purple-mid px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          className="flex size-9 items-center justify-center rounded-lg text-lavender hover:bg-white/5 hover:text-white"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <span className="font-display text-base font-bold text-white">{title}</span>
        <button
          onClick={logout}
          aria-label="Выйти"
          className="flex size-9 items-center justify-center rounded-lg text-lavender hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button aria-label="Закрыть меню" onClick={() => setOpen(false)} className="absolute inset-0 bg-bg/70" />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-purple-mid bg-bg px-3 py-5">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="font-display text-lg font-bold text-white">{title}</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Закрыть меню"
                className="flex size-9 items-center justify-center rounded-lg text-lavender hover:bg-white/5 hover:text-white"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <NavLinks nav={nav} pathname={pathname} onNavigate={() => setOpen(false)} />
            <button
              onClick={logout}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-lavender hover:bg-white/5 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
              Выйти
            </button>
          </div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-purple-mid px-3 py-5 md:flex">
        <div className="mb-6 px-2 font-display text-lg font-bold text-white">{title}</div>
        <NavLinks nav={nav} pathname={pathname} />
        <button
          onClick={logout}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-lavender hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden />
          Выйти
        </button>
      </aside>
    </>
  );
}
