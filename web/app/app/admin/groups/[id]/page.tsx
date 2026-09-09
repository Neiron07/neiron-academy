'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { GroupDetail } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { GroupFormSheet } from '@/components/admin/GroupFormSheet';
import { formatDate, formatRelativeDateTime } from '@/lib/format';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function AdminGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [newWeekday, setNewWeekday] = useState(1);
  const [newTime, setNewTime] = useState('16:00');
  const [newDuration, setNewDuration] = useState(90);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-group-detail', id],
    queryFn: () => api.get<GroupDetail>(`/teacher/groups/${id}`),
  });

  const addDay = useMutation({
    mutationFn: () =>
      api.post(`/admin/groups/${id}/schedule`, { weekday: newWeekday, start_time: newTime, duration_min: newDuration }),
    onSuccess: () => {
      toast('День добавлен в расписание', 'success');
      qc.invalidateQueries({ queryKey: ['admin-group-detail', id] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось добавить день', 'error'),
  });

  const removeDay = useMutation({
    mutationFn: (scheduleId: string) => api.delete(`/admin/groups/${id}/schedule/${scheduleId}`),
    onSuccess: () => {
      toast('День убран из расписания', 'success');
      qc.invalidateQueries({ queryKey: ['admin-group-detail', id] });
    },
    onError: () => toast('Не удалось убрать день', 'error'),
  });

  if (isLoading || !data) return <SkeletonCard />;
  const { group, students, schedule, upcomingLessons, recentLessons } = data;

  return (
    <div>
      <Link href="/app/admin/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-lavender hover:text-white">
        <ArrowLeft className="size-4" aria-hidden /> Группы
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">{group.name}</h1>
          <p className="text-lavender">
            {group.course_name}
            {group.branch_name && ` · ${group.branch_name}`}
            {group.room && ` · каб. ${group.room}`}
          </p>
          <div className="mt-2 flex gap-1.5">
            <StatusBadge tone="neutral" label={`${students.length}/${group.capacity} учеников`} />
            {group.status === 'archived' && <StatusBadge tone="negative" label="Архив" />}
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" aria-hidden /> Изменить
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <p className="mb-2 text-sm font-medium text-lavender">Состав группы</p>
          {students.length === 0 ? (
            <Card className="text-sm text-muted">Учеников пока нет</Card>
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <Card key={s.id} className="flex items-center justify-between">
                  <div>
                    <Link href={`/app/admin/students?search=${encodeURIComponent(s.full_name)}`} className="font-medium text-white hover:underline">
                      {s.full_name}
                    </Link>
                    <p className="text-sm text-lavender">{s.login}</p>
                  </div>
                  <span className="text-sm text-muted">{s.attendance_pct ?? '—'}% посещаемость</span>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-lavender">Расписание</p>
          <Card>
            <div className="mb-3 space-y-2">
              {schedule.length === 0 && <p className="text-sm text-muted">Дни не заданы</p>}
              {schedule.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-purple-mid px-3 py-2">
                  <span className="text-white">
                    {WEEKDAYS[s.weekday - 1]} в {s.start_time.slice(0, 5)}
                  </span>
                  <button
                    onClick={() => removeDay.mutate(s.id)}
                    disabled={removeDay.isPending}
                    className="text-muted hover:text-white"
                    aria-label="Убрать день"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-purple-mid/40 pt-3">
              <select
                value={newWeekday}
                onChange={(e) => setNewWeekday(Number(e.target.value))}
                className="h-10 rounded-lg border border-purple-mid bg-transparent px-2 text-sm text-white outline-none"
              >
                {WEEKDAYS.map((w, i) => (
                  <option key={w} value={i + 1}>
                    {w}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-purple-mid bg-transparent px-2 text-sm text-white outline-none"
              />
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="h-10 w-16 rounded-lg border border-purple-mid bg-transparent px-2 text-sm text-white outline-none"
                title="Длительность, мин"
              />
              <button
                onClick={() => addDay.mutate()}
                disabled={addDay.isPending}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-purple-mid text-lavender hover:text-white"
                aria-label="Добавить день"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </Card>

          {upcomingLessons.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-lavender">Ближайшие уроки</p>
              <div className="space-y-1.5">
                {upcomingLessons.slice(0, 6).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm">
                    <span className="text-white">{formatRelativeDateTime(l.scheduled_at)}</span>
                    <span className="text-muted">{l.status === 'cancelled' ? 'отменён' : 'запланирован'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentLessons.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-lavender">Прошедшие уроки</p>
              <div className="space-y-1.5">
                {recentLessons.slice(0, 6).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm">
                    <span className="text-white">{formatDate(l.scheduled_at)}</span>
                    <span className="text-muted">{l.topic ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <GroupFormSheet group={editOpen ? group : null} onClose={() => setEditOpen(false)} />
    </div>
  );
}
