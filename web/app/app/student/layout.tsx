'use client';

import { User, ShoppingBag, Trophy, ClipboardList } from 'lucide-react';
import { MobileShell } from '@/components/layout/MobileShell';
import { BottomNav } from '@/components/layout/BottomNav';

const items = [
  { href: '/app/student', label: 'Профиль', icon: User },
  { href: '/app/student/shop', label: 'Магазин', icon: ShoppingBag },
  { href: '/app/student/rating', label: 'Рейтинг', icon: Trophy },
  { href: '/app/student/homework', label: 'Домашки', icon: ClipboardList },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell>
      {children}
      <BottomNav items={items} />
    </MobileShell>
  );
}
