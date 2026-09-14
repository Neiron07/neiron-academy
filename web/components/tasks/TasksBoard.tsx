'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Repeat, ClipboardList } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Task, TaskStatus } from '@/lib/types';
import { STATUS_COLUMNS } from '@/lib/task-labels';
import { useCurrentUser } from '@/lib/use-current-user';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { TaskCard } from './TaskCard';
import { TaskFormSheet } from './TaskFormSheet';
import { TaskTemplatesSheet } from './TaskTemplatesSheet';

/**
 * Канбан-доска задач: общая для admin/teacher/marketer, только с разными правами
 * (canManage = admin — может назначать/создавать пул, видит все задачи и шаблоны).
 * Перетаскивание мышью — как усиление для десктопа; на любом устройстве то же самое
 * делает меню "..." на карточке, поэтому мобильная версия ничего не теряет.
 */
export function TasksBoard({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: me } = useCurrentUser();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get<Task[]>('/tasks'),
    refetchInterval: 30_000,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const s of STATUS_COLUMNS) map.set(s.id, []);
    for (const t of tasks ?? []) map.get(t.status)?.push(t);
    return map;
  }, [tasks]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['tasks'] });
  }

  const moveMutation = useMutation({
    mutationFn: (p: { id: string; status: TaskStatus }) => api.patch(`/tasks/${p.id}`, { status: p.status }),
    onSuccess: invalidate,
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось переместить задачу', 'error'),
  });

  const takeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/take`),
    onSuccess: () => {
      toast('Задача взята', 'success');
      invalidate();
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось взять задачу', 'error'),
  });

  const releaseMutation = useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/release`),
    onSuccess: () => {
      toast('Задача возвращена в пул', 'success');
      invalidate();
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось вернуть задачу', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      toast('Задача удалена', 'success');
      invalidate();
    },
    onError: () => toast('Не удалось удалить задачу', 'error'),
  });

  function handleDrop(status: TaskStatus, e: React.DragEvent) {
    e.preventDefault();
    setDragOverStatus(null);
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks?.find((t) => t.id === id);
    if (!task || task.status === status) return;
    moveMutation.mutate({ id, status });
  }

  const isEmpty = !isLoading && (tasks?.length ?? 0) === 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">Задачи</h1>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="secondary" onClick={() => setTemplatesOpen(true)}>
              <Repeat className="size-4" aria-hidden /> Повторяющиеся
            </Button>
          )}
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden /> Новая задача
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {isEmpty && (
        <EmptyState icon={ClipboardList} title="Задач пока нет" hint="Создайте личную задачу или дождитесь назначения" />
      )}

      {!isLoading && !isEmpty && (
        <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {STATUS_COLUMNS.map((col) => {
            const items = byStatus.get(col.id) ?? [];
            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStatus(col.id);
                }}
                onDragLeave={() => setDragOverStatus((s) => (s === col.id ? null : s))}
                onDrop={(e) => handleDrop(col.id, e)}
                className={`w-[280px] shrink-0 rounded-2xl border p-2 transition-colors lg:w-auto ${
                  dragOverStatus === col.id ? 'border-purple bg-purple/5' : 'border-purple-mid/60'
                }`}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-medium text-white">{col.label}</p>
                  <span className="text-xs text-muted">{items.length}</span>
                </div>
                <div className="min-h-8 space-y-2">
                  {items.map((task) => {
                    const isMine = task.assignee_id === me?.id;
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        currentUserId={me?.id}
                        canManage={canManage}
                        draggable={canManage || isMine}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                        onMove={(status) => moveMutation.mutate({ id: task.id, status })}
                        onTake={() => takeMutation.mutate(task.id)}
                        onRelease={() => releaseMutation.mutate(task.id)}
                        onEdit={() => {
                          setEditing(task);
                          setFormOpen(true);
                        }}
                        onDelete={() => deleteMutation.mutate(task.id)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskFormSheet
        open={formOpen}
        existing={editing}
        canManage={canManage}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
      {canManage && <TaskTemplatesSheet open={templatesOpen} onClose={() => setTemplatesOpen(false)} />}
    </div>
  );
}
