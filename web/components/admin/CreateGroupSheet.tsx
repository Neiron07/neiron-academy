'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminGroup, AdminStaff, PublicCourse } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface ScheduleRow {
  weekday: number;
  start_time: string;
  duration_min: number;
}

export function CreateGroupSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [capacity, setCapacity] = useState(6);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([{ weekday: 1, start_time: '16:00', duration_min: 90 }]);

  const { data: courses } = useQuery({
    queryKey: ['public-courses'],
    queryFn: () => api.get<PublicCourse[]>('/public/courses'),
    enabled: open,
  });
  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get<AdminStaff[]>('/admin/teachers'),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<AdminGroup>('/admin/groups', {
        course_id: courseId,
        teacher_id: teacherId || undefined,
        name: name.trim(),
        room: room.trim() || undefined,
        capacity,
        schedule,
      }),
    onSuccess: () => {
      toast('Группа создана, уроки на 14 дней раскатаны', 'success');
      qc.invalidateQueries({ queryKey: ['admin-groups-list'] });
      onClose();
      setName('');
      setRoom('');
      setTeacherId('');
    },
    onError: () => toast('Не удалось создать группу', 'error'),
  });

  return (
    <Sheet open={open} onClose={onClose} title="Новая группа">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Курс</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
          >
            <option value="">Выберите курс</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Input label="Название группы" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Преподаватель (необязательно)</span>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
          >
            <option value="">Не назначен</option>
            {teachers?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-3">
          <Input label="Кабинет" value={room} onChange={(e) => setRoom(e.target.value)} className="flex-1" />
          <Input
            label="Вместимость"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-28"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm text-lavender">Расписание</span>
          <div className="space-y-2">
            {schedule.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={s.weekday}
                  onChange={(e) => updateRow(i, { weekday: Number(e.target.value) })}
                  className="h-10 rounded-lg border border-purple-mid bg-transparent px-2 text-sm text-white outline-none"
                >
                  {WEEKDAYS.map((w, idx) => (
                    <option key={w} value={idx + 1}>
                      {w}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={s.start_time}
                  onChange={(e) => updateRow(i, { start_time: e.target.value })}
                  className="h-10 flex-1 rounded-lg border border-purple-mid bg-transparent px-2 text-sm text-white outline-none"
                />
                <button onClick={() => setSchedule((rows) => rows.filter((_, idx) => idx !== i))} className="text-muted hover:text-white">
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSchedule((rows) => [...rows, { weekday: 1, start_time: '16:00', duration_min: 90 }])}
            className="mt-2 flex items-center gap-1 text-sm text-lavender hover:text-white"
          >
            <Plus className="size-4" aria-hidden /> Добавить день
          </button>
        </div>

        <Button fullWidth size="lg" disabled={!courseId || name.trim().length < 2} loading={create.isPending} onClick={() => create.mutate()}>
          Создать группу
        </Button>
      </div>
    </Sheet>
  );

  function updateRow(i: number, patch: Partial<ScheduleRow>) {
    setSchedule((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
}
