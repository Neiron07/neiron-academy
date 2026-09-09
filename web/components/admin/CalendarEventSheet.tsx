'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { AdminStaff, CalendarEvent, CalendarEventKind } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const KINDS: { id: CalendarEventKind; label: string }[] = [
  { id: 'trial', label: 'Пробный урок' },
  { id: 'event', label: 'Событие' },
];

/** ISO -> значение для <input type="datetime-local"> в локальном времени браузера. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultLocalValue(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return toLocalInputValue(d.toISOString());
}

export function CalendarEventSheet({
  open,
  existing,
  onClose,
}: {
  open: boolean;
  existing: CalendarEvent | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();

  const [kind, setKind] = useState<CalendarEventKind>('trial');
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(defaultLocalValue());
  const [duration, setDuration] = useState(60);
  const [teacherId, setTeacherId] = useState('');
  const [room, setRoom] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get<AdminStaff[]>('/admin/teachers'),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setKind(existing.kind);
      setTitle(existing.title);
      setWhen(toLocalInputValue(existing.starts_at));
      setDuration(existing.duration_min);
      setTeacherId(existing.teacher_id ?? '');
      setRoom(existing.room ?? '');
      setContactName(existing.contact_name ?? '');
      setContactPhone(existing.contact_phone ?? '');
      setDescription(existing.description ?? '');
    } else {
      setKind('trial');
      setTitle('');
      setWhen(defaultLocalValue());
      setDuration(60);
      setTeacherId('');
      setRoom('');
      setContactName('');
      setContactPhone('');
      setDescription('');
    }
    setError('');
  }, [open, existing]);

  const payload = () => ({
    kind,
    title: title.trim(),
    description: description.trim() || undefined,
    starts_at: new Date(when).toISOString(),
    duration_min: duration,
    teacher_id: teacherId || undefined,
    room: room.trim() || undefined,
    contact_name: contactName.trim() || undefined,
    contact_phone: contactPhone.trim() || undefined,
  });

  const save = useMutation({
    mutationFn: () =>
      existing
        ? api.patch(`/admin/calendar/events/${existing.id}`, payload())
        : api.post('/admin/calendar/events', payload()),
    onSuccess: () => {
      toast(existing ? 'Событие обновлено' : 'Событие добавлено', 'success');
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      onClose();
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : 'Не удалось сохранить событие';
      setError(message);
      toast(message, 'error');
    },
  });

  const del = useMutation({
    mutationFn: () => api.delete(`/admin/calendar/events/${existing!.id}`),
    onSuccess: () => {
      toast('Событие удалено', 'success');
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      onClose();
    },
    onError: () => toast('Не удалось удалить событие', 'error'),
  });

  return (
    <Sheet open={open} onClose={onClose} title={existing ? 'Редактировать событие' : 'Новое событие'}>
      <div className="space-y-3">
        <div className="flex gap-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`flex-1 rounded-lg border py-2 text-sm ${kind === k.id ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'}`}
            >
              {k.label}
            </button>
          ))}
        </div>

        <Input
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === 'trial' ? 'Пробный урок: Имя ребёнка' : 'Родительское собрание'}
          autoFocus
        />

        <div className="flex gap-3">
          <label className="flex-1">
            <span className="mb-1.5 block text-sm text-lavender">Дата и время</span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-3 text-white outline-none focus:border-purple"
            />
          </label>
          <Input
            label="Длительность, мин"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-32"
          />
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Преподаватель (необязательно)</span>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
          >
            <option value="">Не назначен</option>
            {teachers
              ?.filter((t) => t.is_active || t.id === teacherId)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                  {!t.is_active ? ' (деактивирован)' : ''}
                </option>
              ))}
          </select>
        </label>

        <Input label="Кабинет (необязательно)" value={room} onChange={(e) => setRoom(e.target.value)} />

        <div className="flex gap-3">
          <Input label="Контакт: имя" value={contactName} onChange={(e) => setContactName(e.target.value)} className="flex-1" />
          <Input label="Контакт: телефон" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="flex-1" />
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Комментарий (необязательно)</span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-purple-mid bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-purple"
          />
        </label>

        {error && <p className="text-sm text-white">{error}</p>}

        <div className="flex gap-2 pt-1">
          {existing && (
            <Button variant="danger-quiet" loading={del.isPending} onClick={() => del.mutate()}>
              Удалить
            </Button>
          )}
          <Button fullWidth disabled={title.trim().length < 2} loading={save.isPending} onClick={() => save.mutate()}>
            Сохранить
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
