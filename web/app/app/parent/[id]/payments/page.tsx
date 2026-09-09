'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import type { ParentPaymentsResponse } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatDate, formatKzt } from '@/lib/format';

const METHOD_LABEL: Record<string, string> = { kaspi: 'Kaspi', cash: 'Наличные', transfer: 'Перевод' };

export default function PaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['parent-payments', id],
    queryFn: () => api.get<ParentPaymentsResponse>(`/parent/children/${id}/payments`),
  });

  if (isLoading) return <SkeletonRow />;
  if (!data || data.payments.length === 0) return <EmptyState icon={Receipt} title="Оплат пока нет" />;

  return (
    <div className="space-y-3">
      {data.balance && (
        <Card className="flex items-center justify-between">
          <span className="text-lavender">Остаток абонемента</span>
          <span className="font-display text-lg font-semibold text-white">{data.balance.lessons_left} занятий</span>
        </Card>
      )}

      <Button variant="secondary" fullWidth className="no-print" onClick={() => window.print()}>
        <Printer className="size-4" aria-hidden /> Справка об оплате
      </Button>

      <div className="space-y-2">
        {data.payments.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{formatKzt(p.amount_kzt)}</p>
              <p className="text-sm text-lavender">
                {p.lessons_count} занятий · {METHOD_LABEL[p.method]}
              </p>
              {p.period_label && <p className="text-sm text-muted">{p.period_label}</p>}
            </div>
            <span className="text-sm text-muted">{formatDate(p.paid_at)}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
