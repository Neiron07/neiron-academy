'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Repeat, ClipboardList } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Task, TaskStatus, TaskType } from '@/lib/types';
import { STATUS_COLUMNS, TYPE_LABEL } from '@/lib/task-labels';
import { useCurrentUser } from '@/lib/use-current-user';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { TaskCard } from './TaskCard';
import { TaskFormSheet } from './TaskFormSheet';
import { TaskTemplatesSheet } from './TaskTemplatesSheet';

type Scope = 'all' | 'mine' | 'pool';
const SCOPE_LABEL: Record<Scope, string> = { all: 'Все', mine: 'Мои', pool: 'Пул' };
const SCOPES: Scope[] = ['all', 'mine', 'pool'];
const TYPE_FILTERS: (TaskType | 'all')[] = ['all', 'personal', 'assigned', 'pool', 'recurring', 'automatic'];

const selectClass =
  'h-10 rounded-lg border border-purple-mid bg-transparent px-3 text-sm text-white outline-none focus:border-purple';

/**
 * Канбан-доска задач: общая для admin/teacher/marketer, только с разными правами
 * (canManage = admin — может назначать/создавать пул, видит все задачи и шаблоны).
 * Перетаскивание мышью — как усиление для десктопа; на любом устройстве то же самое
 * делает меню "..." на карточке, поэтому мобильная версия ничего не теряет.
 * Внутри колонки перетаскивание на карточку переставляет задачу перед ней (свой
 * порядок), между колонками — как раньше, меняет статус.
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

  const [scope, setScope] = useState<Scope>(canManage ? 'all' : 'mine');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const filtered = useMemo(() => {
    return (tasks ?? []).filter((t) => {
      if (scope === 'mine' && t.assignee_id !== me?.id) return false;
      if (scope === 'pool' && t.assignee_id !== null) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      return true;
    });
  }, [tasks, scope, typeFilter, me?.id]);

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const s of STATUS_COLUMNS) map.set(s.id, []);
    for (const t of filtered) map.get(t.status)?.push(t);
    return map;
  }, [filtered]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['tasks'] });
  }

  const patchMutation = useMutation({
    mutationFn: (p: { id: string; status?: TaskStatus; position?: number }) =>
      api.patch(`/tasks/${p.id}`, { ...(p.status ? { status: p.status } : {}), ...(p.position !== undefined ? { position: p.position } : {}) }),
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

  /** Отпустили на пустое место колонки — статус меняется (если другой), задача уходит в конец. */
  function handleColumnDrop(status: TaskStatus, e: React.DragEvent) {
    e.preventDefault();
    setDragOverStatus(null);
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks?.find((t) => t.id === id);
    if (!task) return;
    const columnItems = (byStatus.get(status) ?? []).filter((t) => t.id !== id);
    const last = columnItems[columnItems.length - 1];
    const position = last ? last.position + 1 : Date.now() / 1000;
    if (task.status === status && columnItems.length === 0) return;
    patchMutation.mutate({ id, status: task.status === status ? undefined : status, position });
  }

  /** Отпустили прямо на карточку — вставляем перед ней (в её колонке). */
  function handleCardDrop(target: Task, e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStatus(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === target.id) return;
    const dragged = tasks?.find((t) => t.id === draggedId);
    if (!dragged) return;

    const columnItems = (byStatus.get(target.status) ?? []).filter((t) => t.id !== draggedId);
    const idx = columnItems.findIndex((t) => t.id === target.id);
    const prev = idx > 0 ? columnItems[idx - 1] : undefined;
    const position = prev ? (prev.position + target.position) / 2 : target.position - 1;

    patchMutation.mutate({ id: draggedId, status: dragged.status === target.status ? undefined : target.status, position });
  }

  const isEmpty = !isLoading && (tasks?.length ?? 0) === 0;
  const isFilteredEmpty = !isLoading && !isEmpty && filtered.length === 0;

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

      {!isLoading && !isEmpty && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-purple-mid p-1">
            {SCOPES.map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  scope === s ? 'bg-purple text-white' : 'text-lavender hover:text-white'
                }`}
              >
                {SCOPE_LABEL[s]}
              </button>
            ))}
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TaskType | 'all')} className={selectClass}>
            <option value="all">Все типы</option>
            {TYPE_FILTERS.filter((t) => t !== 'all').map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t as TaskType]}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {isEmpty && (
        <EmptyState icon={ClipboardList} title="Задач пока нет" hint="Создайте личную задачу или дождитесь назначения" />
      )}

      {isFilteredEmpty && (
        <EmptyState icon={ClipboardList} title="По этому фильтру ничего нет" hint="Попробуйте выбрать «Все»" />
      )}

      {!isLoading && !isEmpty && !isFilteredEmpty && (
        <div className="flex items-start gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:items-start lg:overflow-visible">
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
                onDrop={(e) => handleColumnDrop(col.id, e)}
                className={`flex w-[280px] shrink-0 flex-col rounded-2xl border p-2 transition-colors lg:w-auto ${
                  dragOverStatus === col.id ? 'border-purple bg-purple/5' : 'border-purple-mid/60'
                }`}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-medium text-white">{col.label}</p>
                  <span className="text-xs text-muted">{items.length}</span>
                </div>
                <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-0.5">
                  {items.length === 0 && <p className="px-1 text-xs text-muted">Пусто</p>}
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
                        onCardDrop={(e) => handleCardDrop(task, e)}
                        onMove={(status) => patchMutation.mutate({ id: task.id, status })}
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
