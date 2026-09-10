'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronRight, MapPin, Sparkles, CalendarDays, CalendarCheck2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { TeacherTodayResponse } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { InvertCard, Card } from '@/components/ui/Card';
import { formatRelativeDateTime, formatTime, formatDate, formatWeekday } from '@/lib/format';

export default function TeacherTodayPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-today'],
    queryFn: () => api.get<TeacherTodayResponse>('/teacher/today'),
  });

  const today = new Date().toISOString();

  return (
    <>
      <TopBar title="Сегодня" />
      <p className="-mt-3 mb-5 text-sm capitalize text-lavender">
        {formatWeekday(today)}, {formatDate(today)}
      </p>

      {isLoading && (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {data && data.overdue.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-white">
            <AlertTriangle className="size-4" aria-hidden />
            Незакрытые уроки — отметьте сейчас
          </div>
          <div className="space-y-2">
            {data.overdue.map((l) => (
              <Link key={l.id} href={`/app/teacher/lessons/${l.id}`}>
                <InvertCard className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{l.group_name}</p>
                    <p className="text-sm opacity-70">{formatRelativeDateTime(l.scheduled_at)}</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0" aria-hidden />
                </InvertCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data && (data.today.length > 0 || data.events.length > 0) && (
        <section className="space-y-2">
          {data.today.map((l) => (
            <Link key={l.id} href={`/app/teacher/lessons/${l.id}`}>
              <Card className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-white">{l.group_name}</p>
                  <p className="text-sm text-lavender">
                    {l.course_name} · {formatTime(l.scheduled_at)}
                    {l.room && (
                      <>
                        {' · '}
                        <MapPin className="mb-0.5 inline size-3.5" aria-hidden /> {l.room}
                      </>
                    )}
                  </p>
                  {l.status === 'completed' ? (
                    <p className="mt-1 text-sm text-lavender">Проведён</p>
                  ) : (
                    <p className="mt-1 text-sm text-muted">
                      Отмечено {l.marked_count} из {l.students_count}
                    </p>
                  )}
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
              </Card>
            </Link>
          ))}

          {data.events.map((e) => {
            const Icon = e.kind === 'trial' ? Sparkles : CalendarDays;
            return (
              <Card key={e.id} className="flex items-center gap-3 border-purple bg-purple/10">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple/20">
                  <Icon className="size-4 text-purple" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{e.title}</p>
                  <p className="text-sm text-lavender">
                    {e.kind === 'trial' ? 'Пробный урок' : 'Событие'} · {formatTime(e.starts_at)}
                    {e.room && ` · ${e.room}`}
                  </p>
                  {e.contact_name && (
                    <p className="mt-1 text-sm text-muted">
                      {e.contact_name}
                      {e.contact_phone && ` · ${e.contact_phone}`}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {data && data.today.length === 0 && data.overdue.length === 0 && data.events.length === 0 && (
        <>
          <EmptyState icon={CalendarCheck2} title="На сегодня уроков нет" hint="Ближайшие занятия — ниже" />
          {data.upcoming.length > 0 && (
            <section className="mt-6 space-y-2">
              <p className="text-sm font-medium text-lavender">Ближайшие уроки</p>
              {data.upcoming.map((l) => (
                <Card key={l.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{l.group_name}</p>
                    <p className="text-sm text-lavender">
                      {l.course_name} · {formatRelativeDateTime(l.scheduled_at)}
                    </p>
                  </div>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
