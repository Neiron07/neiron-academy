'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, BookOpen, Sparkles, CalendarDays, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminCalendarResponse, CalendarEvent, CalendarLesson } from '@/lib/types';
import { weekDays, almatyToday } from '@/lib/calendar';
import { almatyDayKey, formatTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { CalendarEventSheet } from '@/components/admin/CalendarEventSheet';

const WEEKDAY_LABEL = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type Entry =
  | { type: 'lesson'; time: string; data: CalendarLesson }
  | { type: 'event'; time: string; data: CalendarEvent };

export default function AdminCalendarPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [offset, setOffset] = useState(0);
  const [sheet, setSheet] = useState<{ open: boolean; existing: CalendarEvent | null }>({ open: false, existing: null });
  const [cancelLesson, setCancelLesson] = useState<CalendarLesson | null>(null);

  const days = useMemo(() => weekDays(offset), [offset]);
  const today = almatyToday();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-calendar', days[0], days[6]],
    queryFn: () => api.get<AdminCalendarResponse>(`/admin/calendar?from=${days[0]}&to=${days[6]}`),
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

  const cancelLessonMutation = useMutation({
    mutationFn: (p: { id: string; reason: string }) => api.post(`/lessons/${p.id}/cancel`, { reason: p.reason, by_school: true }),
    onSuccess: () => {
      toast('Урок отменён', 'success');
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      setCancelLesson(null);
    },
    onError: () => toast('Не удалось отменить урок', 'error'),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">Календарь</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Предыдущая неделя"
            className="flex size-9 items-center justify-center rounded-lg border border-purple-mid text-lavender hover:text-white"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            onClick={() => setOffset(0)}
            className="rounded-lg border border-purple-mid px-3 py-2 text-sm text-lavender hover:text-white"
          >
            Сегодня
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Следующая неделя"
            className="flex size-9 items-center justify-center rounded-lg border border-purple-mid text-lavender hover:text-white"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <Button onClick={() => setSheet({ open: true, existing: null })}>
            <Plus className="size-4" aria-hidden /> Добавить
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day, i) => (
            <div key={day} className={`rounded-2xl border p-2 ${day === today ? 'border-purple' : 'border-purple-mid'}`}>
              <p className={`mb-2 px-1 text-sm font-medium ${day === today ? 'text-white' : 'text-lavender'}`}>
                {WEEKDAY_LABEL[i]} · {Number(day.slice(8, 10))}
              </p>
              <div className="space-y-1.5">
                {(byDay.get(day) ?? []).length === 0 && <p className="px-1 text-xs text-muted">—</p>}
                {(byDay.get(day) ?? []).map((entry) =>
                  entry.type === 'lesson' ? (
                    <LessonEntry key={entry.data.id} lesson={entry.data} onCancel={() => setCancelLesson(entry.data)} />
                  ) : (
                    <EventEntry
                      key={entry.data.id}
                      event={entry.data}
                      onClick={() => setSheet({ open: true, existing: entry.data })}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CalendarEventSheet
        open={sheet.open}
        existing={sheet.existing}
        onClose={() => setSheet({ open: false, existing: null })}
      />

      {cancelLesson && (
        <CancelLessonDialog
          lesson={cancelLesson}
          loading={cancelLessonMutation.isPending}
          onCancel={(reason) => cancelLessonMutation.mutate({ id: cancelLesson.id, reason })}
          onClose={() => setCancelLesson(null)}
        />
      )}
    </div>
  );
}

function LessonEntry({ lesson, onCancel }: { lesson: CalendarLesson; onCancel: () => void }) {
  const cancelled = lesson.status === 'cancelled';
  return (
    <div className={`group relative rounded-xl border p-2 text-xs ${cancelled ? 'border-muted opacity-60' : 'border-purple-mid'}`}>
      <div className="flex items-start gap-1.5">
        <BookOpen className="mt-0.5 size-3.5 shrink-0 text-purple" aria-hidden />
        <div className="min-w-0">
          <p className="font-medium text-white">
            {formatTime(lesson.scheduled_at)} · {lesson.group_name}
          </p>
          <p className="truncate text-muted">
            {lesson.teacher_name ?? 'без преподавателя'}
            {lesson.room && ` · ${lesson.room}`}
          </p>
          {cancelled && <p className="text-muted">Отменён</p>}
        </div>
      </div>
      {!cancelled && lesson.status === 'planned' && (
        <button
          onClick={onCancel}
          className="absolute right-1 top-1 hidden rounded p-1 text-muted hover:text-white group-hover:block"
          aria-label="Отменить урок"
          title="Отменить урок"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

function EventEntry({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const Icon = event.kind === 'trial' ? Sparkles : CalendarDays;
  return (
    <button
      onClick={onClick}
      className="block w-full rounded-xl border border-purple bg-purple/10 p-2 text-left text-xs hover:bg-purple/20"
    >
      <div className="flex items-start gap-1.5">
        <Icon className="mt-0.5 size-3.5 shrink-0 text-purple" aria-hidden />
        <div className="min-w-0">
          <p className="font-medium text-white">
            {formatTime(event.starts_at)} · {event.title}
          </p>
          <p className="truncate text-muted">
            {event.teacher_name ?? (event.kind === 'trial' ? 'пробный урок' : 'событие')}
            {event.room && ` · ${event.room}`}
          </p>
        </div>
      </div>
    </button>
  );
}

function CancelLessonDialog({
  lesson,
  loading,
  onCancel,
  onClose,
}: {
  lesson: CalendarLesson;
  loading: boolean;
  onCancel: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-purple bg-purple-deep p-5 shadow-[0_20px_60px_-10px_rgba(21,9,48,0.6)]">
        <h2 className="mb-1 font-display text-lg font-semibold text-white">Отменить урок</h2>
        <p className="mb-3 text-sm text-lavender">{lesson.group_name}, {formatTime(lesson.scheduled_at)}</p>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Причина отмены"
          autoFocus
          className="mb-3 h-11 w-full rounded-xl border border-purple-mid bg-transparent px-3 text-white placeholder:text-muted outline-none focus:border-purple"
        />
        <p className="mb-4 text-xs text-muted">Ученики не потеряют коины и урок абонемента — школа берёт отмену на себя.</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
          <Button fullWidth disabled={reason.trim().length < 3} loading={loading} onClick={() => onCancel(reason.trim())}>
            Отменить урок
          </Button>
        </div>
      </div>
    </div>
  );
}
