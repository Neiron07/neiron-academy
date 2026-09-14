'use client';

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  GraduationCap,
  UsersRound,
  Wallet,
  ShoppingBag,
  Kanban,
  ClipboardList,
  History,
} from 'lucide-react';
import { StaffSidebar, type StaffNavItem } from '@/components/layout/StaffSidebar';

const NAV: StaffNavItem[] = [
  { href: '/app/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/app/admin/calendar', label: 'Календарь', icon: CalendarDays },
  { href: '/app/admin/tasks', label: 'Задачи', icon: ClipboardList },
  { href: '/app/admin/teachers', label: 'Учителя', icon: GraduationCap },
  { href: '/app/admin/students', label: 'Ученики', icon: Users },
  { href: '/app/admin/groups', label: 'Группы', icon: UsersRound },
  { href: '/app/admin/payments', label: 'Оплаты', icon: Wallet },
  { href: '/app/admin/shop', label: 'Магазин', icon: ShoppingBag },
  { href: '/app/admin/leads', label: 'Лиды', icon: Kanban },
  { href: '/app/admin/activity-log', label: 'Журнал действий', icon: History },
];

export function AdminSidebar() {
  return <StaffSidebar title="Neiron Admin" nav={NAV} />;
}
