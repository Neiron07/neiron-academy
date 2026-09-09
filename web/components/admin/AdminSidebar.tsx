'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Users, GraduationCap, UsersRound, Wallet, ShoppingBag, Kanban, LogOut } from 'lucide-react';
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

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <aside className="sticky top-0 flex h-dvh w-56 shrink-0 flex-col border-r border-purple-mid px-3 py-5">
      <div className="mb-6 px-2 font-display text-lg font-bold text-white">Neiron Admin</div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = item.href === '/app/admin' ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
      <button
        onClick={logout}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-lavender hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-4" aria-hidden />
        Выйти
      </button>
    </aside>
  );
}
