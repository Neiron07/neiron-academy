'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UsersRound, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { TeacherGroup } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { CreateGroupSheet } from '@/components/admin/CreateGroupSheet';
import { GroupFormSheet } from '@/components/admin/GroupFormSheet';

export default function AdminGroupsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<TeacherGroup | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-groups-list'],
    queryFn: () => api.get<TeacherGroup[]>('/teacher/groups?status=all'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean; archived: boolean }>(`/admin/groups/${id}`),
    onSuccess: (res) => {
      toast(res.archived ? 'В группе есть история уроков — архивировали, а не удалили' : 'Группа удалена', 'success');
      qc.invalidateQueries({ queryKey: ['admin-groups-list'] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось удалить группу', 'error'),
  });

  const restore = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/groups/${id}`, { status: 'active' }),
    onSuccess: () => {
      toast('Группа восстановлена', 'success');
      qc.invalidateQueries({ queryKey: ['admin-groups-list'] });
    },
    onError: () => toast('Не удалось восстановить группу', 'error'),
  });

  function handleDelete(g: TeacherGroup) {
    if (window.confirm(`Удалить группу «${g.name}»?`)) remove.mutate(g.id);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">Группы</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden /> Создать группу
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data?.length === 0 && <EmptyState icon={UsersRound} title="Групп пока нет" />}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((g) => (
          <Card key={g.id} className={g.status === 'archived' ? 'opacity-50' : ''}>
            <Link href={`/app/admin/groups/${g.id}`} className="block">
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="font-medium text-white hover:underline">{g.name}</p>
                {g.status === 'archived' && <StatusBadge tone="negative" label="Архив" />}
              </div>
              <p className="text-sm text-lavender">{g.course_name}</p>
              {g.branch_name && <p className="text-sm text-lavender">{g.branch_name}</p>}
              <p className="mt-2 text-sm text-muted">
                {g.students_count}/{g.capacity} учеников{g.room && ` · ${g.room}`}
              </p>
            </Link>
            <div className="mt-3 flex gap-1.5">
              {g.status === 'archived' ? (
                <Button size="sm" variant="secondary" loading={restore.isPending} onClick={() => restore.mutate(g.id)}>
                  <RotateCcw className="size-3.5" aria-hidden /> Восстановить
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="secondary" onClick={() => setEditGroup(g)}>
                    <Pencil className="size-3.5" aria-hidden /> Изменить
                  </Button>
                  <Button size="sm" variant="danger-quiet" loading={remove.isPending} onClick={() => handleDelete(g)}>
                    <Trash2 className="size-3.5" aria-hidden /> Удалить
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      <CreateGroupSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <GroupFormSheet group={editGroup} onClose={() => setEditGroup(null)} />
    </div>
  );
}
