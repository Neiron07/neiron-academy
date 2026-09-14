'use client';

import { CalendarDays, ClipboardList } from 'lucide-react';
import { StaffSidebar, type StaffNavItem } from '@/components/layout/StaffSidebar';

const NAV: StaffNavItem[] = [
  { href: '/app/marketer/calendar', label: 'Календарь', icon: CalendarDays },
  { href: '/app/marketer/tasks', label: 'Задачи', icon: ClipboardList },
];

export default function MarketerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col md:flex-row">
      <StaffSidebar title="Neiron Маркетинг" nav={NAV} />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 md:px-8 md:py-6">{children}</main>
    </div>
  );
}
