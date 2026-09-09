'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, UsersRound } from 'lucide-react';
import { api } from '@/lib/api';
import type { TeacherGroup } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateGroupSheet } from '@/components/admin/CreateGroupSheet';

export default function AdminGroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-groups-list'],
    queryFn: () => api.get<TeacherGroup[]>('/teacher/groups'),
  });

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
          <Card key={g.id}>
            <p className="font-medium text-white">{g.name}</p>
            <p className="text-sm text-lavender">{g.course_name}</p>
            <p className="mt-2 text-sm text-muted">
              {g.students_count}/{g.capacity} учеников{g.room && ` · ${g.room}`}
            </p>
          </Card>
        ))}
      </div>

      <CreateGroupSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
