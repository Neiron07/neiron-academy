'use client';

import { LogOut } from 'lucide-react';
import { useLogout } from '@/lib/use-logout';

export function TopBar({ title, right }: { title: string; right?: React.ReactNode }) {
  const logout = useLogout();
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="font-display text-xl font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-2">
        {right}
        <button
          onClick={logout}
          aria-label="Выйти"
          className="flex size-9 items-center justify-center rounded-full text-lavender hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
