'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  GraduationCap,
  UsersRound,
  Wallet,
  ShoppingBag,
  Kanban,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useLogout } from '@/lib/use-logout';

const NAV = [
  { href: '/app/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/app/admin/calendar', label: 'Календарь', icon: CalendarDays },
  { href: '/app/admin/teachers', label: 'Учителя', icon: GraduationCap },
  { href: '/app/admin/students', label: 'Ученики', icon: Users },
  { href: '/app/admin/groups', label: 'Группы', icon: UsersRound },
  { href: '/app/admin/payments', label: 'Оплаты', icon: Wallet },
  { href: '/app/admin/shop', label: 'Магазин', icon: ShoppingBag },
  { href: '/app/admin/leads', label: 'Лиды', icon: Kanban },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active = item.href === '/app/admin' ? pathname === item.href : pathname.startsWith(item.href);
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

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  // Закрыть мобильное меню при переходе на новый маршрут.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Мобильная шапка: гамбургер вместо постоянного сайдбара, который на телефоне только мешал. */}
      <div className="flex items-center justify-between border-b border-purple-mid px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          className="flex size-9 items-center justify-center rounded-lg text-lavender hover:bg-white/5 hover:text-white"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <span className="font-display text-base font-bold text-white">Neiron Admin</span>
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
              <span className="font-display text-lg font-bold text-white">Neiron Admin</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Закрыть меню"
                className="flex size-9 items-center justify-center rounded-lg text-lavender hover:bg-white/5 hover:text-white"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
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

      {/* Десктоп: постоянный сайдбар как раньше. */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-purple-mid px-3 py-5 md:flex">
        <div className="mb-6 px-2 font-display text-lg font-bold text-white">Neiron Admin</div>
        <NavLinks pathname={pathname} />
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
