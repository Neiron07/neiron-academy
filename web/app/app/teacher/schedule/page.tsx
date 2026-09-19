'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Sparkles, CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';
import type { CalendarEvent, TeacherScheduleItem, TeacherScheduleResponse } from '@/lib/types';
import { weekDays, almatyToday, TRIAL_CLASSES } from '@/lib/calendar';
import { almatyDayKey, formatTime } from '@/lib/format';

type Entry = { time: string; durationMin: number } & (
  | { type: 'lesson'; data: TeacherScheduleItem }
  | { type: 'event'; data: CalendarEvent }
);

const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOUR_START = 8;
const HOUR_END = 21;
const ROW_HEIGHT = 56; // px за час
const GRID_HEIGHT = (HOUR_END - HOUR_START) * ROW_HEIGHT;

function minutesFromGridStart(iso: string): number {
  const d = new Date(iso);
  const almatyMinutes = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit', hour12: false })
      .format(d)
      .replace(':', ''),
  );
  const hours = Math.floor(almatyMinutes / 100);
  const minutes = almatyMinutes % 100;
  return (hours - HOUR_START) * 60 + minutes;
}

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
      map.get(key)?.push({ type: 'lesson', time: l.scheduled_at, durationMin: l.duration_min, data: l });
    }
    for (const e of data?.events ?? []) {
      const key = almatyDayKey(e.starts_at);
      map.get(key)?.push({ type: 'event', time: e.starts_at, durationMin: e.duration_min, data: e });
    }
    return map;
  }, [data, days]);

  const isEmpty = !isLoading && [...byDay.values()].every((entries) => entries.length === 0);
  const nowOffsetMin = minutesFromGridStart(new Date().toISOString());
  const showNowLine = nowOffsetMin >= 0 && nowOffsetMin <= (HOUR_END - HOUR_START) * 60;

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

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-purple-mid" />
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-purple-mid py-12 text-center">
          <CalendarDays className="size-8 text-muted" aria-hidden />
          <p className="text-sm text-muted">На этой неделе занятий не запланировано</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-purple-mid">
          <div className="flex" style={{ minWidth: 56 + days.length * 132 }}>
            {/* колонка с часами */}
            <div className="sticky left-0 z-10 w-14 shrink-0 border-r border-purple-mid bg-bg">
              <div className="h-10 border-b border-purple-mid" />
              <div className="relative" style={{ height: GRID_HEIGHT }}>
                {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 w-full px-1.5 text-right text-[10px] text-muted"
                    style={{ top: i * ROW_HEIGHT - 6 }}
                  >
                    {HOUR_START + i}:00
                  </div>
                ))}
              </div>
            </div>

            {days.map((day, dayIdx) => {
              const entries = byDay.get(day) ?? [];
              const isToday = day === today;
              return (
                <div key={day} className={`w-[132px] shrink-0 border-r border-purple-mid last:border-r-0 ${isToday ? 'bg-purple/5' : ''}`}>
                  <div className="flex h-10 flex-col items-center justify-center border-b border-purple-mid">
                    <p className={`text-xs font-medium ${isToday ? 'text-white' : 'text-lavender'}`}>{WEEKDAY_SHORT[dayIdx]}</p>
                    <p className={`text-[10px] ${isToday ? 'text-purple' : 'text-muted'}`}>{Number(day.slice(8, 10))}</p>
                  </div>
                  <div className="relative" style={{ height: GRID_HEIGHT }}>
                    {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                      <div key={i} className="absolute left-0 w-full border-t border-purple-mid/30" style={{ top: i * ROW_HEIGHT }} />
                    ))}
                    {isToday && showNowLine && (
                      <div
                        className="absolute left-0 z-10 h-px w-full bg-purple"
                        style={{ top: (nowOffsetMin / 60) * ROW_HEIGHT }}
                      >
                        <div className="absolute -left-0.5 -top-1 size-2 rounded-full bg-purple" />
                      </div>
                    )}
                    {entries.map((entry) => (
                      <GridEntry key={entry.data.id} entry={entry} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function GridEntry({ entry }: { entry: Entry }) {
  const startMin = Math.max(0, minutesFromGridStart(entry.time));
  const maxMin = (HOUR_END - HOUR_START) * 60;
  const endMin = Math.min(maxMin, startMin + entry.durationMin);
  const top = (startMin / 60) * ROW_HEIGHT;
  const height = Math.max(20, ((endMin - startMin) / 60) * ROW_HEIGHT - 2);
  if (startMin >= maxMin || endMin <= 0) return null;

  const isTrial = entry.type === 'event' && entry.data.kind === 'trial';
  const cancelled = entry.type === 'lesson' && entry.data.status === 'cancelled';

  const classes = isTrial
    ? `${TRIAL_CLASSES.border} ${TRIAL_CLASSES.bg} ${TRIAL_CLASSES.text}`
    : entry.type === 'event'
      ? 'border-purple bg-purple/15 text-lavender'
      : cancelled
        ? 'border-muted bg-bg text-muted opacity-60'
        : 'border-purple-mid bg-purple-deep text-lavender';

  const title = entry.type === 'lesson' ? entry.data.group_name : entry.data.title;
  const subtitle = entry.type === 'lesson' ? entry.data.course_name : isTrial ? 'Пробный урок' : 'Событие';

  const content = (
    <div
      className={`absolute inset-x-0.5 overflow-hidden rounded-lg border px-1.5 py-1 text-left text-[10px] leading-tight ${classes}`}
      style={{ top, height }}
    >
      <p className="flex items-center gap-1 truncate font-medium text-white">
        {isTrial && <Sparkles className="size-2.5 shrink-0" aria-hidden />}
        {formatTime(entry.time)} {title}
      </p>
      {height > 32 && <p className="truncate">{subtitle}</p>}
    </div>
  );

  if (entry.type === 'lesson') {
    return (
      <Link href={`/app/teacher/lessons/${entry.data.id}`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
