'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Power, Sparkles, CalendarDays } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { AdminStaffDetail } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { TeacherFormSheet } from '@/components/admin/TeacherFormSheet';
import { formatRelativeDateTime } from '@/lib/format';

export default function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-teacher', id],
    queryFn: () => api.get<AdminStaffDetail>(`/admin/teachers/${id}`),
  });

  const toggleActive = useMutation({
    mutationFn: (is_active: boolean) => api.patch(`/admin/teachers/${id}`, { is_active }),
    onSuccess: () => {
      toast('Готово', 'success');
      qc.invalidateQueries({ queryKey: ['admin-teacher', id] });
      qc.invalidateQueries({ queryKey: ['admin-teachers'] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось изменить статус', 'error'),
  });

  if (isLoading || !data) return <SkeletonCard />;
  const { teacher, groups, events } = data;

  return (
    <div>
      <Link href="/app/admin/teachers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-lavender hover:text-white">
        <ArrowLeft className="size-4" aria-hidden /> Учителя
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">{teacher.full_name}</h1>
          <p className="text-lavender">{teacher.phone}</p>
          <div className="mt-2 flex gap-1.5">
            <StatusBadge tone="neutral" label={teacher.role === 'admin' ? 'Админ' : 'Преподаватель'} />
            <StatusBadge tone={teacher.is_active ? 'positive' : 'negative'} label={teacher.is_active ? 'Активен' : 'Деактивирован'} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden /> Изменить
          </Button>
          <Button
            variant={teacher.is_active ? 'danger-quiet' : 'secondary'}
            loading={toggleActive.isPending}
            onClick={() => toggleActive.mutate(!teacher.is_active)}
          >
            <Power className="size-4" aria-hidden /> {teacher.is_active ? 'Деактивировать' : 'Восстановить'}
          </Button>
        </div>
      </div>

      <section className="mb-6">
        <p className="mb-2 text-sm font-medium text-lavender">Группы</p>
        {groups.length === 0 && <EmptyState icon={CalendarDays} title="Групп не назначено" />}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id}>
              <p className="font-medium text-white">{g.name}</p>
              <p className="text-sm text-lavender">{g.course_name}</p>
              <p className="mt-1 text-sm text-muted">
                {g.students_count}/{g.capacity} учеников{g.room && ` · ${g.room}`}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-medium text-lavender">Пробные уроки и события</p>
        {events.length === 0 && <EmptyState icon={Sparkles} title="Ничего не назначено" hint="Назначь в разделе «Календарь»" />}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <Card key={e.id}>
              <p className="font-medium text-white">{e.title}</p>
              <p className="text-sm text-lavender">{formatRelativeDateTime(e.starts_at)}</p>
              {e.contact_name && <p className="text-sm text-muted">{e.contact_name}{e.contact_phone && ` · ${e.contact_phone}`}</p>}
            </Card>
          ))}
        </div>
      </section>

      <TeacherFormSheet open={editOpen} existing={teacher} onClose={() => setEditOpen(false)} />
    </div>
  );
}
