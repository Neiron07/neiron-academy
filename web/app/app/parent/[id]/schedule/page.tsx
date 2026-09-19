'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, User, MapPin, Bell, BookOpen, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { ParentScheduleItem } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { formatDate, formatTime, formatWeekday } from '@/lib/format';

/** «Осталось 2 часа» — только пока занятие сегодня-завтра и правда скоро, иначе не отвлекаем. */
const REMINDER_WINDOW_HOURS = 4;

function timeLeftLabel(scheduledAt: string): string | null {
  const ms = new Date(scheduledAt).getTime() - Date.now();
  if (ms <= 0 || ms > REMINDER_WINDOW_HOURS * 3_600_000) return null;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}

export default function ParentSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['parent-schedule', id],
    queryFn: () => api.get<ParentScheduleItem[]>(`/parent/children/${id}/schedule`),
  });

  if (isLoading) return <SkeletonCard />;

  const now = Date.now();
  const upcoming = (data ?? []).filter((l) => l.status === 'planned' && new Date(l.scheduled_at).getTime() > now);
  const next = upcoming[0];
  const rest = upcoming.slice(1);

  if (!next) {
    return <EmptyState icon={CalendarDays} title="Ближайших занятий не запланировано" />;
  }

  const reminder = timeLeftLabel(next.scheduled_at);
  const endsAt = new Date(new Date(next.scheduled_at).getTime() + next.duration_min * 60_000);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-lavender">Ближайшее занятие</p>
        <Card className="border-purple bg-purple/10 p-5">
          <p className="font-display text-lg font-semibold text-white">{next.course_name}</p>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-white">
              <CalendarDays className="size-4 shrink-0 text-purple" aria-hidden />
              <span className="capitalize">{formatWeekday(next.scheduled_at)}, {formatDate(next.scheduled_at)}</span>
            </p>
            <p className="flex items-center gap-2 text-white">
              <Clock className="size-4 shrink-0 text-purple" aria-hidden />
              {formatTime(next.scheduled_at)} – {formatTime(endsAt.toISOString())}
            </p>
            {next.teacher_id ? (
              <Link href={`/app/parent/${id}/teacher/${next.teacher_id}`} className="flex items-center gap-2 text-lavender hover:text-white hover:underline">
                <User className="size-4 shrink-0 text-purple" aria-hidden />
                {next.teacher_name}
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-lavender">
                <User className="size-4 shrink-0 text-purple" aria-hidden />
                Преподаватель уточняется
              </p>
            )}
            <p className="flex items-center gap-2 text-lavender">
              <MapPin className="size-4 shrink-0 text-purple" aria-hidden />
              {next.branch_name ?? 'Neiron Academy'}
              {next.room && ` · ${next.room}`}
            </p>
            {next.topic && (
              <p className="flex items-center gap-2 text-lavender">
                <BookOpen className="size-4 shrink-0 text-purple" aria-hidden />
                {next.topic}
              </p>
            )}
          </div>

          {reminder && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-3 py-2 text-sm text-white">
              <Bell className="size-4 shrink-0" aria-hidden />
              До занятия осталось {reminder}
            </div>
          )}
        </Card>
      </div>

      {rest.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-lavender">Дальше</p>
          <div className="space-y-2">
            {rest.map((l) => (
              <Card key={l.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="size-4 shrink-0 text-muted" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-white">{l.course_name}</p>
                    <p className="truncate text-sm text-lavender">{l.topic ?? l.teacher_name ?? '—'}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="text-white">{formatDate(l.scheduled_at)}</p>
                  <p className="text-muted">{formatTime(l.scheduled_at)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
