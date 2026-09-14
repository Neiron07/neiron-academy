'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical, User, Clock, ArrowRightCircle, Undo2, Pencil, Trash2 } from 'lucide-react';
import type { Task, TaskStatus } from '@/lib/types';
import { STATUS_COLUMNS, PRIORITY_DOT, TYPE_LABEL } from '@/lib/task-labels';
import { formatRelativeDateTime } from '@/lib/format';

export function TaskCard({
  task,
  currentUserId,
  canManage,
  draggable,
  onDragStart,
  onMove,
  onTake,
  onRelease,
  onEdit,
  onDelete,
}: {
  task: Task;
  currentUserId: string | undefined;
  canManage: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onMove: (status: TaskStatus) => void;
  onTake: () => void;
  onRelease: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  const isMine = task.assignee_id === currentUserId;
  const isOpenForTaking = task.assignee_id === null && task.status !== 'done' && task.status !== 'canceled';
  const canRelease = isMine && task.type !== 'assigned';
  const isOwnPersonal = task.type === 'personal' && task.created_by === currentUserId;
  const canEditDelete = canManage || isOwnPersonal;
  const canChangeStatus = canManage || isMine;
  const overdue = task.due_at && task.status !== 'done' && task.status !== 'canceled' && new Date(task.due_at) < new Date();

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`rounded-2xl border bg-purple-deep p-3 transition-colors ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${overdue ? 'border-white/40' : 'border-purple-mid'}`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} aria-hidden />
          <p className="min-w-0 break-words font-medium text-white">{task.title}</p>
        </div>

        <div ref={ref} className="relative shrink-0">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Действия с задачей"
            className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-white"
          >
            <MoreVertical className="size-4" aria-hidden />
          </button>
          {open && (
            <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-purple-mid bg-purple-deep p-1 shadow-[0_20px_60px_-10px_rgba(21,9,48,0.6)]">
              {isOpenForTaking && (
                <MenuButton
                  icon={ArrowRightCircle}
                  label="Взять себе"
                  onClick={() => {
                    onTake();
                    setOpen(false);
                  }}
                />
              )}
              {canRelease && (
                <MenuButton
                  icon={Undo2}
                  label="Вернуть в пул"
                  onClick={() => {
                    onRelease();
                    setOpen(false);
                  }}
                />
              )}
              {canChangeStatus && (
                <>
                  <p className="px-3 pb-1 pt-2 text-xs text-muted">Переместить в</p>
                  {STATUS_COLUMNS.filter((s) => s.id !== task.status).map((s) => (
                    <MenuButton
                      key={s.id}
                      icon={ArrowRightCircle}
                      label={s.label}
                      onClick={() => {
                        onMove(s.id);
                        setOpen(false);
                      }}
                    />
                  ))}
                </>
              )}
              {canEditDelete && (
                <>
                  <div className="my-1 border-t border-purple-mid" />
                  <MenuButton
                    icon={Pencil}
                    label="Редактировать"
                    onClick={() => {
                      onEdit();
                      setOpen(false);
                    }}
                  />
                  <MenuButton
                    icon={Trash2}
                    label="Удалить"
                    onClick={() => {
                      onDelete();
                      setOpen(false);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {task.description && <p className="mb-2 line-clamp-2 text-sm text-lavender">{task.description}</p>}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {task.assignee_name ? (
          <span className="flex items-center gap-1">
            <User className="size-3.5" aria-hidden /> {task.assignee_name}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-lavender">
            <User className="size-3.5" aria-hidden /> Свободна
          </span>
        )}
        {task.due_at && (
          <span className={`flex items-center gap-1 ${overdue ? 'text-white' : ''}`}>
            <Clock className="size-3.5" aria-hidden /> {formatRelativeDateTime(task.due_at)}
          </span>
        )}
        {task.type !== 'assigned' && task.type !== 'personal' && <span>{TYPE_LABEL[task.type]}</span>}
      </div>
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof MoreVertical;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-lavender hover:bg-white/5 hover:text-white"
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
