'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, BookOpen, User } from 'lucide-react';
import { api } from '@/lib/api';
import type { StudentScheduleItem } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { almatyDayKey, formatDate, formatTime, formatWeekday } from '@/lib/format';

export default function StudentSchedulePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-schedule'],
    queryFn: () => api.get<StudentScheduleItem[]>('/me/schedule'),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, StudentScheduleItem[]>();
    for (const l of data ?? []) {
      const key = almatyDayKey(l.scheduled_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    for (const items of map.values()) items.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <>
      <TopBar title="Расписание" />

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {!isLoading && byDay.length === 0 && (
        <EmptyState icon={CalendarDays} title="Занятий пока не запланировано" />
      )}

      <div className="space-y-5">
        {byDay.map(([day, entries]) => {
          const iso = `${day}T00:00:00`;
          return (
            <div key={day}>
              <p className="mb-2 text-sm font-medium capitalize text-lavender">
                {formatWeekday(iso)}, {formatDate(iso)}
              </p>
              <div className="space-y-2">
                {entries.map((l) => (
                  <Card key={l.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{l.group_name}</p>
                      {l.topic ? (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-lavender">
                          <BookOpen className="size-3.5 shrink-0 text-purple" aria-hidden /> {l.topic}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-sm text-muted">{l.room ?? 'Neiron Academy'}</p>
                      )}
                      {l.teacher_id && (
                        <Link
                          href={`/app/student/teacher/${l.teacher_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-purple hover:underline"
                        >
                          <User className="size-3" aria-hidden /> {l.teacher_name}
                        </Link>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {l.status === 'cancelled' && <StatusBadge tone="negative" label="Отменён" />}
                      {l.status === 'completed' && <StatusBadge tone="positive" label="Проведён" />}
                      <span className="text-sm text-white">{formatTime(l.scheduled_at)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
