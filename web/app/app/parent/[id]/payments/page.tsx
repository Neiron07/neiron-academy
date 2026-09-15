'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Check, MessageCircle, Printer, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import type { ParentChild, ParentPaymentsResponse } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatDate, formatKzt } from '@/lib/format';
import { daysUntil, paymentBadgeClass, paymentStatusText } from '@/lib/payment-status';
import { waLink } from '@/lib/constants';

const METHOD_LABEL: Record<string, string> = { kaspi: 'Kaspi', cash: 'Наличные', transfer: 'Перевод' };

export default function PaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['parent-payments', id],
    queryFn: () => api.get<ParentPaymentsResponse>(`/parent/children/${id}/payments`),
  });
  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => api.get<ParentChild[]>('/parent/children'),
  });
  const childName = children?.find((c) => c.id === id)?.full_name ?? 'ребёнка';

  if (isLoading) return <SkeletonRow />;
  if (!data) return null;

  const days = data.next_payment_estimate ? daysUntil(data.next_payment_estimate) : null;

  return (
    <div className="space-y-3">
      <Card className="p-5">
        <p className="flex items-center gap-1.5 text-sm text-lavender">
          <CreditCard className="size-4" aria-hidden /> Обучение
        </p>
        <p className="mt-1 font-display text-lg font-semibold text-white">{data.course_name ?? 'Без направления'}</p>

        {data.last_payment_at && data.next_payment_estimate && (
          <div className="mt-3">
            <p className="text-sm text-lavender">Текущий период</p>
            <p className="text-white">
              {formatDate(data.last_payment_at)} – {formatDate(data.next_payment_estimate)}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-lavender">Статус</span>
          {days === null ? (
            <span className="text-lavender">—</span>
          ) : (
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${paymentBadgeClass(days)}`}>
              {paymentStatusText(days)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-lavender">Следующая оплата</span>
          <span className="text-white">{data.next_payment_estimate ? formatDate(data.next_payment_estimate) : '—'}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-lavender">Сумма</span>
          <span className="text-white">{data.last_payment_amount ? formatKzt(data.last_payment_amount) : '—'}</span>
        </div>

        <a
          href={waLink(`Хочу оплатить за ${childName} по направлению ${data.course_name ?? 'занятия'}`)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block"
        >
          <Button fullWidth>
            <MessageCircle className="size-4" aria-hidden /> Оплатить
          </Button>
        </a>
      </Card>

      {data.balance && (
        <Card className="flex items-center justify-between">
          <span className="text-lavender">Остаток абонемента</span>
          <span className="font-display text-lg font-semibold text-white">{data.balance.lessons_left} занятий</span>
        </Card>
      )}

      <Button variant="secondary" fullWidth className="no-print" onClick={() => window.print()}>
        <Printer className="size-4" aria-hidden /> Справка об оплате
      </Button>

      <div>
        <p className="mb-2 text-sm font-medium text-lavender">История</p>
        {data.payments.length === 0 ? (
          <EmptyState icon={Receipt} title="Оплат пока нет" />
        ) : (
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">{formatDate(p.paid_at)}</span>
                  <Check className="size-4 text-[#4ADE80]" aria-hidden />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
