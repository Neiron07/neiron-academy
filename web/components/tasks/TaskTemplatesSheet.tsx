'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Repeat } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { AdminStaff, TaskPriority, TaskTemplate } from '@/lib/types';
import { PRIORITY_LABEL, WEEKDAY_LABEL } from '@/lib/task-labels';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export function TaskTemplatesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const [title, setTitle] = useState('');
  const [weekday, setWeekday] = useState(1);
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => api.get<TaskTemplate[]>('/tasks/templates'),
    enabled: open,
  });

  const { data: staff } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get<AdminStaff[]>('/admin/teachers'),
    enabled: open,
  });

  function resetForm() {
    setTitle('');
    setWeekday(1);
    setAssigneeId('');
    setPriority('medium');
    setAdding(false);
  }

  const create = useMutation({
    mutationFn: () =>
      api.post('/tasks/templates', {
        title: title.trim(),
        weekday,
        priority,
        assignee_id: assigneeId || undefined,
      }),
    onSuccess: () => {
      toast('Шаблон добавлен', 'success');
      qc.invalidateQueries({ queryKey: ['task-templates'] });
      resetForm();
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось добавить шаблон', 'error'),
  });

  const toggleActive = useMutation({
    mutationFn: (p: { id: string; is_active: boolean }) => api.patch(`/tasks/templates/${p.id}`, { is_active: p.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-templates'] }),
    onError: () => toast('Не удалось обновить шаблон', 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/templates/${id}`),
    onSuccess: () => {
      toast('Шаблон удалён', 'success');
      qc.invalidateQueries({ queryKey: ['task-templates'] });
    },
    onError: () => toast('Не удалось удалить шаблон', 'error'),
  });

  return (
    <Sheet open={open} onClose={onClose} title="Повторяющиеся задачи">
      <div className="space-y-3">
        <p className="text-sm text-lavender">
          Каждый шаблон раскатывается в новую задачу в свой день недели — пока предыдущая не закрыта, вторая не создастся.
        </p>

        {!adding ? (
          <Button variant="secondary" fullWidth onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden /> Добавить шаблон
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-purple-mid p-3">
            <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            <label className="block">
              <span className="mb-1.5 block text-sm text-lavender">День недели</span>
              <select
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-purple-mid bg-transparent px-3 text-white outline-none focus:border-purple"
              >
                {WEEKDAYS.map((w) => (
                  <option key={w} value={w}>
                    {WEEKDAY_LABEL[w]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-lavender">Кому (необязательно — иначе в пул)</span>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="h-11 w-full rounded-xl border border-purple-mid bg-transparent px-3 text-white outline-none focus:border-purple"
              >
                <option value="">В общий пул</option>
                {staff
                  ?.filter((s) => s.is_active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
              </select>
            </label>
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
            <div className="flex gap-2">
              <Button variant="ghost" onClick={resetForm}>
                Отмена
              </Button>
              <Button fullWidth disabled={title.trim().length < 2} loading={create.isPending} onClick={() => create.mutate()}>
                Создать
              </Button>
            </div>
          </div>
        )}

        {!isLoading && templates?.length === 0 && (
          <EmptyState icon={Repeat} title="Шаблонов пока нет" hint="Например: «Отчёт по лидам» каждый понедельник" />
        )}

        <div className="space-y-2">
          {templates?.map((t) => (
            <div key={t.id} className={`rounded-xl border p-3 ${t.is_active ? 'border-purple-mid' : 'border-purple-mid/40 opacity-50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{t.title}</p>
                  <p className="text-sm text-lavender">
                    {WEEKDAY_LABEL[t.weekday]} · {t.assignee_name ?? 'общий пул'} · {PRIORITY_LABEL[t.priority]}
                  </p>
                </div>
                <button onClick={() => remove.mutate(t.id)} className="shrink-0 text-muted hover:text-white" aria-label="Удалить шаблон">
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              <button
                onClick={() => toggleActive.mutate({ id: t.id, is_active: !t.is_active })}
                className="mt-2 text-xs text-lavender underline hover:text-white"
              >
                {t.is_active ? 'Отключить' : 'Включить'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
