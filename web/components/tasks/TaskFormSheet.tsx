'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { AdminStaff, Task, TaskPriority, TaskType } from '@/lib/types';
import { PRIORITY_LABEL, TYPE_LABEL } from '@/lib/task-labels';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const CREATABLE_TYPES: TaskType[] = ['personal', 'assigned', 'pool'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

/** ISO -> значение для <input type="datetime-local"> в локальном времени браузера. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskFormSheet({
  open,
  existing,
  canManage,
  onClose,
}: {
  open: boolean;
  existing: Task | null;
  canManage: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('personal');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState('');

  const { data: staff } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get<AdminStaff[]>('/admin/teachers'),
    enabled: open && canManage,
  });

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setType(existing.type);
      setAssigneeId(existing.assignee_id ?? '');
      setPriority(existing.priority);
      setDueAt(existing.due_at ? toLocalInputValue(existing.due_at) : '');
    } else {
      setTitle('');
      setDescription('');
      setType('personal');
      setAssigneeId('');
      setPriority('medium');
      setDueAt('');
    }
    setError('');
  }, [open, existing]);

  const save = useMutation({
    mutationFn: () => {
      const dueIso = dueAt ? new Date(dueAt).toISOString() : undefined;
      if (existing) {
        return api.patch<Task>(`/tasks/${existing.id}`, {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_at: dueIso ?? null,
          ...(canManage && type === 'assigned' && assigneeId ? { assignee_id: assigneeId } : {}),
        });
      }
      return api.post<Task>('/tasks', {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        assignee_id: type === 'assigned' ? assigneeId || undefined : undefined,
        priority,
        due_at: dueIso,
      });
    },
    onSuccess: () => {
      toast(existing ? 'Задача обновлена' : 'Задача создана', 'success');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : 'Не удалось сохранить задачу';
      setError(message);
      toast(message, 'error');
    },
  });

  const canSave =
    title.trim().length >= 2 && (type !== 'assigned' || !canManage || assigneeId.length > 0);

  return (
    <Sheet open={open} onClose={onClose} title={existing ? 'Редактировать задачу' : 'Новая задача'}>
      <div className="space-y-3">
        {!existing && canManage && (
          <div>
            <span className="mb-1.5 block text-sm text-lavender">Тип задачи</span>
            <div className="flex gap-2">
              {CREATABLE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border py-2 text-sm ${type === t ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'}`}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />

        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Описание (необязательно)</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-purple-mid bg-transparent px-4 py-3 text-white outline-none focus:border-purple"
          />
        </label>

        {canManage && type === 'assigned' && (
          <label className="block">
            <span className="mb-1.5 block text-sm text-lavender">Кому назначить</span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
            >
              <option value="">Выберите сотрудника</option>
              {staff
                ?.filter((s) => s.is_active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
            </select>
          </label>
        )}

        <div>
          <span className="mb-1.5 block text-sm text-lavender">Приоритет</span>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 rounded-lg border py-2 text-sm ${priority === p ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'}`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Срок (необязательно)</span>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-3 text-white outline-none focus:border-purple"
          />
        </label>

        {error && <p className="text-sm text-white">{error}</p>}

        <Button fullWidth size="lg" disabled={!canSave} loading={save.isPending} onClick={() => save.mutate()}>
          Сохранить
        </Button>
      </div>
    </Sheet>
  );
}
