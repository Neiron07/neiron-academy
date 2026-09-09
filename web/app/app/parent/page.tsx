'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ParentChild } from '@/lib/types';
import { MobileShell } from '@/components/layout/MobileShell';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

export default function ParentEntryPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => api.get<ParentChild[]>('/parent/children'),
  });

  useEffect(() => {
    if (data?.length === 1 && data[0]) router.replace(`/app/parent/${data[0].id}`);
  }, [data, router]);

  if (isLoading || (data && data.length === 1)) {
    return (
      <MobileShell withBottomNav={false}>
        <TopBar title="Мои дети" />
        <SkeletonRow />
      </MobileShell>
    );
  }

  return (
    <MobileShell withBottomNav={false}>
      <TopBar title="Мои дети" />
      {data?.length === 0 && <EmptyState icon={Users} title="Дети не привязаны" hint="Обратитесь в школу, чтобы привязать ребёнка к аккаунту" />}
      <div className="space-y-2">
        {data?.map((c) => (
          <Card
            key={c.id}
            role="link"
            tabIndex={0}
            onClick={() => router.push(`/app/parent/${c.id}`)}
            className="cursor-pointer"
          >
            <p className="font-medium text-white">{c.full_name}</p>
            <p className="text-sm text-lavender">
              {c.course_name ?? 'Без группы'}
              {c.group_name && ` · ${c.group_name}`}
            </p>
          </Card>
        ))}
      </div>
    </MobileShell>
  );
}
