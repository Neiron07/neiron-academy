'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import type { RatingResponse } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';

export default function RatingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['rating'],
    queryFn: () => api.get<RatingResponse>('/me/rating'),
  });

  return (
    <>
      <TopBar title="Рейтинг группы" />
      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data && data.rows.length === 0 && <EmptyState icon={Trophy} title="Пока нет данных за месяц" hint="Приходи на уроки — рейтинг обновляется по ходу месяца" />}
      <div className="space-y-2">
        {data?.rows.map((r) => (
          <Card
            key={r.position}
            className={`flex items-center justify-between gap-3 ${r.is_me ? 'border-purple bg-purple/10' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full border border-purple-mid font-display text-sm font-semibold text-white">
                {r.position}
              </span>
              <div>
                <p className="font-medium text-white">
                  {r.full_name}
                  {r.is_me && <span className="ml-1.5 text-sm text-lavender">это ты</span>}
                </p>
                <p className="text-sm text-lavender">Уровень {r.level}</p>
              </div>
            </div>
            <span className="font-display text-sm font-semibold text-white">{r.month_xp} XP</span>
          </Card>
        ))}
      </div>
    </>
  );
}
