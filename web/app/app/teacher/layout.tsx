'use client';

import { usePathname } from 'next/navigation';
import { Home, Users, CalendarDays, Package, ClipboardList } from 'lucide-react';
import { MobileShell } from '@/components/layout/MobileShell';
import { BottomNav } from '@/components/layout/BottomNav';

const items = [
  { href: '/app/teacher', label: 'Сегодня', icon: Home },
  { href: '/app/teacher/groups', label: 'Группы', icon: Users },
  { href: '/app/teacher/schedule', label: 'Расписание', icon: CalendarDays },
  { href: '/app/teacher/tasks', label: 'Задачи', icon: ClipboardList },
  { href: '/app/teacher/orders', label: 'Заказы', icon: Package },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Канбану из 5 колонок и календарной сетке из 7 дней тесно в стандартных
  // 480px — расширяем только на десктопе и только для этих разделов,
  // мобильная раскладка везде остаётся как была (на мобилке сетка скроллится).
  const isTasks = pathname?.startsWith('/app/teacher/tasks');
  const isSchedule = pathname?.startsWith('/app/teacher/schedule');

  return (
    <MobileShell maxWidthClass={isTasks || isSchedule ? 'max-w-[480px] lg:max-w-[1300px]' : 'max-w-[480px]'}>
      {children}
      <BottomNav items={items} />
    </MobileShell>
  );
}
