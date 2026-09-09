'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';
import type { TeacherScheduleItem } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatTime, formatWeekday } from '@/lib/format';

export default function TeacherSchedulePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-schedule'],
    queryFn: () => api.get<TeacherScheduleItem[]>('/teacher/schedule'),
  });

  const groups = groupByDay(data ?? []);

  return (
    <>
      <TopBar title="Расписание" />
      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data?.length === 0 && <EmptyState icon={CalendarDays} title="Занятий не запланировано" />}
      <div className="space-y-5">
        {groups.map(([day, items]) => (
          <div key={day}>
            <p className="mb-2 text-sm font-medium text-lavender">
              {formatWeekday(items[0]!.scheduled_at)}, {formatDate(items[0]!.scheduled_at)}
            </p>
            <div className="space-y-2">
              {items.map((l) => (
                <Card key={l.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{l.group_name}</p>
                    <p className="text-sm text-lavender">{l.course_name}</p>
                  </div>
                  <span className="text-sm text-white">{formatTime(l.scheduled_at)}</span>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function groupByDay(items: TeacherScheduleItem[]): [string, TeacherScheduleItem[]][] {
  const map = new Map<string, TeacherScheduleItem[]>();
  for (const item of items) {
    const key = item.scheduled_at.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()];
}
