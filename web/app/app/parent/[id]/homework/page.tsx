'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import type { ParentHomeworkItem } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatRelativeDateTime } from '@/lib/format';

const STATUS_INFO: Record<string, { label: string; tone: 'positive' | 'neutral' | 'negative' }> = {
  submitted: { label: 'На проверке', tone: 'neutral' },
  accepted: { label: 'Принята', tone: 'positive' },
  excellent: { label: 'Отлично', tone: 'positive' },
  rework: { label: 'На доработке', tone: 'negative' },
};

export default function ParentHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['parent-homework', id],
    queryFn: () => api.get<ParentHomeworkItem[]>(`/parent/children/${id}/homework`),
  });

  if (isLoading) return <SkeletonRow />;
  if (!data || data.length === 0) return <EmptyState icon={ClipboardList} title="Домашних заданий пока не было" />;

  return (
    <div className="space-y-2">
      {data.map((h) => {
        const info = (h.status && STATUS_INFO[h.status]) || { label: 'Не сдана', tone: 'negative' as const };
        return (
          <Card key={h.id}>
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="font-medium text-white">{h.title}</p>
              <StatusBadge tone={info.tone} label={info.label} />
            </div>
            {h.description && <p className="mb-1 text-sm text-lavender">{h.description}</p>}
            {h.deadline_at && <p className="text-sm text-muted">Дедлайн: {formatRelativeDateTime(h.deadline_at)}</p>}
            {h.feedback && <p className="mt-1 text-sm text-lavender">Комментарий препода: {h.feedback}</p>}
          </Card>
        );
      })}
    </div>
  );
}
