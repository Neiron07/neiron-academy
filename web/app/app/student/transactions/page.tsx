'use client';

import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import type { CoinTransaction } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { formatRelativeDateTime } from '@/lib/format';

export default function TransactionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get<CoinTransaction[]>('/me/transactions'),
  });

  return (
    <>
      <TopBar title="История коинов" />
      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data?.length === 0 && <EmptyState icon={Receipt} title="Пока пусто" hint="Коины появятся здесь после первого урока" />}
      <div className="divide-y divide-purple-mid/40">
        {data?.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-white">{t.reason_text ?? t.reason_code}</p>
              <p className="text-sm text-muted">{formatRelativeDateTime(t.created_at)}</p>
            </div>
            <span className={`flex shrink-0 items-center gap-1 font-display font-semibold ${t.coins < 0 ? 'text-muted' : 'text-white'}`}>
              {t.coins > 0 ? '+' : ''}
              {t.coins}
              <CoinIcon className="size-4" />
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
