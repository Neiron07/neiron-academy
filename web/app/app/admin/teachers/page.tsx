'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, ChevronRight, GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminStaff } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TeacherFormSheet } from '@/components/admin/TeacherFormSheet';

export default function AdminTeachersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get<AdminStaff[]>('/admin/teachers'),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">Учителя</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden /> Добавить сотрудника
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data?.length === 0 && <EmptyState icon={GraduationCap} title="Сотрудников пока нет" />}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((t) => (
          <Link key={t.id} href={`/app/admin/teachers/${t.id}`}>
            <Card className={`flex items-center justify-between gap-2 ${!t.is_active ? 'opacity-50' : ''}`}>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{t.full_name}</p>
                <p className="text-sm text-lavender">{t.phone}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge tone="neutral" label={t.role === 'admin' ? 'Админ' : 'Преподаватель'} />
                  {!t.is_active && <StatusBadge tone="negative" label="Деактивирован" />}
                  {Number(t.groups_count) > 0 && <StatusBadge tone="positive" label={`${t.groups_count} групп`} />}
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
            </Card>
          </Link>
        ))}
      </div>

      <TeacherFormSheet open={createOpen} existing={null} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
