'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareHeart } from 'lucide-react';
import { api } from '@/lib/api';
import type { ParentFeedbackItem } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatRelativeDateTime } from '@/lib/format';

const KIND_LABEL: Record<string, string> = {
  highlight: 'Отличился',
  attention: 'Нужно внимание',
  group_note: 'По группе',
};

export default function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['parent-feedback', id],
    queryFn: () => api.get<ParentFeedbackItem[]>(`/parent/children/${id}/feedback`),
  });

  if (isLoading) return <SkeletonRow />;
  if (!data || data.length === 0) {
    return <EmptyState icon={MessageSquareHeart} title="Обратной связи пока нет" hint="Появится после следующего урока" />;
  }

  return (
    <div className="space-y-2">
      {data.map((f) => (
        <Card key={f.id} className={f.kind === 'group_note' ? 'border-purple-mid' : 'border-purple'}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-lavender">{KIND_LABEL[f.kind]}</span>
            <span className="text-xs text-muted">{formatRelativeDateTime(f.created_at)}</span>
          </div>
          <p className="text-white">{f.text}</p>
          {f.teacher_name && <p className="mt-1 text-sm text-muted">— {f.teacher_name}</p>}
        </Card>
      ))}
    </div>
  );
}
