'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { TeacherGroup } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function TeacherGroupsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-groups'],
    queryFn: () => api.get<TeacherGroup[]>('/teacher/groups'),
  });

  return (
    <>
      <TopBar title="Мои группы" />
      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data?.length === 0 && <EmptyState icon={Users} title="Групп пока нет" />}
      <div className="space-y-2">
        {data?.map((g) => (
          <Link key={g.id} href={`/app/teacher/groups/${g.id}`}>
            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{g.name}</p>
                <p className="text-sm text-lavender">
                  {g.course_name}
                  {g.current_topic && ` · ${g.current_topic}`}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {g.students_count}/{g.capacity} учеников{g.room && ` · ${g.room}`}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
