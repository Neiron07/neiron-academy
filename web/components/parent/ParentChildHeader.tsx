'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import type { ParentChild } from '@/lib/types';
import { useLogout } from '@/lib/use-logout';

const TABS = [
  { id: '', label: 'Сводка' },
  { id: 'attendance', label: 'Посещаемость' },
  { id: 'feedback', label: 'Обратная связь' },
  { id: 'homework', label: 'Домашки' },
  { id: 'payments', label: 'Оплаты' },
];

export function ParentChildHeader({ childId }: { childId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => api.get<ParentChild[]>('/parent/children'),
  });

  const activeTab = pathname.split(`/${childId}`)[1]?.replace('/', '') ?? '';

  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        {children && children.length > 1 ? (
          <select
            value={childId}
            onChange={(e) => router.push(`/app/parent/${e.target.value}`)}
            className="h-10 flex-1 rounded-xl border border-purple-mid bg-purple-deep px-3 font-display text-base font-semibold text-white outline-none"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        ) : (
          <h1 className="font-display text-xl font-semibold text-white">{children?.[0]?.full_name ?? 'Ребёнок'}</h1>
        )}
        <button
          onClick={logout}
          aria-label="Выйти"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-lavender hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      </div>
      <div className="flex gap-1 overflow-x-auto no-print" role="tablist">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/app/parent/${childId}${t.id ? `/${t.id}` : ''}`}
            role="tab"
            aria-selected={activeTab === t.id}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === t.id ? 'bg-purple text-white' : 'text-lavender hover:text-white'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
