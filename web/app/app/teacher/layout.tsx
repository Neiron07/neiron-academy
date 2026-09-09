'use client';

import { Home, Users, CalendarDays, Package } from 'lucide-react';
import { MobileShell } from '@/components/layout/MobileShell';
import { BottomNav } from '@/components/layout/BottomNav';

const items = [
  { href: '/app/teacher', label: 'Сегодня', icon: Home },
  { href: '/app/teacher/groups', label: 'Группы', icon: Users },
  { href: '/app/teacher/schedule', label: 'Расписание', icon: CalendarDays },
  { href: '/app/teacher/orders', label: 'Заказы', icon: Package },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell>
      {children}
      <BottomNav items={items} />
    </MobileShell>
  );
}
