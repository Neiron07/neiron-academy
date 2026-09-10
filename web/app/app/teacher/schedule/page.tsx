'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import type { CalendarEvent, TeacherScheduleItem, TeacherScheduleResponse } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { weekDays, almatyToday } from '@/lib/calendar';
import { almatyDayKey, formatDate, formatTime, formatWeekday } from '@/lib/format';

type Entry = { time: string } & ({ type: 'lesson'; data: TeacherScheduleItem } | { type: 'event'; data: CalendarEvent });

export default function TeacherSchedulePage() {
  const [offset, setOffset] = useState(0);
  const days = useMemo(() => weekDays(offset), [offset]);
  const today = almatyToday();

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-schedule', days[0], days[6]],
    queryFn: () => api.get<TeacherScheduleResponse>(`/teacher/schedule?from=${days[0]}&to=${days[6]}`),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const day of days) map.set(day, []);
    for (const l of data?.lessons ?? []) {
      const key = almatyDayKey(l.scheduled_at);
      map.get(key)?.push({ type: 'lesson', time: l.scheduled_at, data: l });
    }
    for (const e of data?.events ?? []) {
      const key = almatyDayKey(e.starts_at);
      map.get(key)?.push({ type: 'event', time: e.starts_at, data: e });
    }
    for (const entries of map.values()) entries.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [data, days]);

  const isEmpty = !isLoading && days.every((d) => (byDay.get(d) ?? []).length === 0);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-white">Расписание</h1>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Предыдущая неделя"
            className="flex size-8 items-center justify-center rounded-lg border border-purple-mid text-lavender hover:text-white"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          {offset !== 0 && (
            <button
              onClick={() => setOffset(0)}
              className="rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender hover:text-white"
            >
              Сегодня
            </button>
          )}
          <button
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Следующая неделя"
            className="flex size-8 items-center justify-center rounded-lg border border-purple-mid text-lavender hover:text-white"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {isEmpty && <EmptyState icon={CalendarDays} title="На этой неделе занятий не запланировано" />}

      <div className="space-y-5">
        {days.map((day) => {
          const entries = byDay.get(day) ?? [];
          if (entries.length === 0) return null;
          const iso = `${day}T00:00:00`;
          return (
            <div key={day}>
              <p className={`mb-2 text-sm font-medium capitalize ${day === today ? 'text-white' : 'text-lavender'}`}>
                {formatWeekday(iso)}, {formatDate(iso)}
                {day === today && ' · сегодня'}
              </p>
              <div className="space-y-2">
                {entries.map((entry) =>
                  entry.type === 'lesson' ? (
                    <Link key={entry.data.id} href={`/app/teacher/lessons/${entry.data.id}`}>
                      <Card className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{entry.data.group_name}</p>
                          <p className="text-sm text-lavender">{entry.data.course_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.data.status === 'cancelled' && <StatusBadge tone="negative" label="Отменён" />}
                          {entry.data.status === 'completed' && <StatusBadge tone="positive" label="Проведён" />}
                          <span className="text-sm text-white">{formatTime(entry.data.scheduled_at)}</span>
                        </div>
                      </Card>
                    </Link>
                  ) : (
                    <Card key={entry.data.id} className="flex items-center gap-3 border-purple bg-purple/10">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple/20">
                        {entry.data.kind === 'trial' ? (
                          <Sparkles className="size-4 text-purple" aria-hidden />
                        ) : (
                          <CalendarDays className="size-4 text-purple" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{entry.data.title}</p>
                        <p className="text-sm text-lavender">{entry.data.kind === 'trial' ? 'Пробный урок' : 'Событие'}</p>
                      </div>
                      <span className="text-sm text-white">{formatTime(entry.data.starts_at)}</span>
                    </Card>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
