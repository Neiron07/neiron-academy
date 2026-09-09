'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle, X, CalendarX2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import type { ParentAttendanceDay } from '@/lib/types';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMonth, almatyDayKey } from '@/lib/format';
import { CalendarDays } from 'lucide-react';

export default function AttendanceCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['parent-attendance', id],
    queryFn: () => api.get<ParentAttendanceDay[]>(`/parent/children/${id}/attendance`),
  });

  if (isLoading) return <SkeletonCard />;
  if (!data || data.length === 0) return <EmptyState icon={CalendarDays} title="Пока нет данных о посещаемости" />;

  const byMonth = groupByMonth(data);

  return (
    <div className="space-y-6">
      {byMonth.map(([month, days]) => (
        <MonthGrid key={month} monthKey={month} days={days} />
      ))}
      <Legend />
    </div>
  );
}

function groupByMonth(items: ParentAttendanceDay[]): [string, ParentAttendanceDay[]][] {
  const map = new Map<string, ParentAttendanceDay[]>();
  for (const it of items) {
    const key = almatyDayKey(it.scheduled_at).slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function MonthGrid({ monthKey, days }: { monthKey: string; days: ParentAttendanceDay[] }) {
  const [yStr, mStr] = monthKey.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = (first.getUTCDay() + 6) % 7; // 0 = Monday

  const byDay = new Map(days.map((d) => [Number(almatyDayKey(d.scheduled_at).slice(8, 10)), d]));

  const cells: (ParentAttendanceDay | null | undefined)[] = [
    ...Array(firstWeekday).fill(undefined),
    ...Array.from({ length: daysInMonth }, (_, i) => byDay.get(i + 1) ?? null),
  ];

  return (
    <div>
      <p className="mb-2 text-sm font-medium capitalize text-lavender">{formatMonth(first.toISOString())}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
          <div key={d} className="text-center text-xs text-muted">
            {d}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell === undefined ? (
            <div key={i} />
          ) : (
            <DayCell key={i} day={cell} />
          ),
        )}
      </div>
    </div>
  );
}

function DayCell({ day }: { day: ParentAttendanceDay | null }) {
  if (!day) return <div className="aspect-square rounded-lg" />;

  const dayOfMonth = Number(almatyDayKey(day.scheduled_at).slice(8, 10));

  if (day.cancelled_by_school) {
    return (
      <div
        title="Урок отменён школой"
        className="flex aspect-square items-center justify-center rounded-lg border border-purple-mid text-xs text-lavender"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, var(--color-purple-mid) 0, var(--color-purple-mid) 2px, transparent 2px, transparent 6px)',
          backgroundColor: 'rgba(90,54,162,0.12)',
        }}
      >
        {dayOfMonth}
      </div>
    );
  }

  const status = day.attendance_status;
  if (status === 'present') {
    return (
      <div title="Был" className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg bg-purple text-white">
        <Check className="size-3" aria-hidden />
        <span className="text-[10px]">{dayOfMonth}</span>
      </div>
    );
  }
  if (status === 'late') {
    return (
      <div title="Опоздал" className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg bg-purple text-white">
        <Circle className="size-2.5 fill-current" aria-hidden />
        <span className="text-[10px]">{dayOfMonth}</span>
      </div>
    );
  }
  if (status === 'excused') {
    return (
      <div title="Пропустил по уважительной" className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border border-purple-mid text-lavender">
        <Clock className="size-3" aria-hidden />
        <span className="text-[10px]">{dayOfMonth}</span>
      </div>
    );
  }
  if (status === 'absent') {
    return (
      <div title="Прогул" className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border border-muted text-muted">
        <X className="size-3" aria-hidden />
        <span className="text-[10px]">{dayOfMonth}</span>
      </div>
    );
  }
  return (
    <div className="flex aspect-square items-center justify-center rounded-lg text-xs text-muted/60">{dayOfMonth}</div>
  );
}

function Legend() {
  const items = [
    { icon: Check, label: 'Был', cls: 'bg-purple text-white' },
    { icon: Circle, label: 'Опоздал', cls: 'bg-purple text-white' },
    { icon: Clock, label: 'Уважительная', cls: 'border border-purple-mid text-lavender' },
    { icon: X, label: 'Прогул', cls: 'border border-muted text-muted' },
    { icon: CalendarX2, label: 'Отменён школой', cls: 'border border-purple-mid text-lavender' },
  ];
  return (
    <div className="flex flex-wrap gap-3 border-t border-purple-mid/40 pt-4 text-xs text-lavender">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5">
          <span className={`flex size-5 items-center justify-center rounded ${i.cls}`}>
            <i.icon className="size-3" aria-hidden />
          </span>
          {i.label}
        </div>
      ))}
    </div>
  );
}
