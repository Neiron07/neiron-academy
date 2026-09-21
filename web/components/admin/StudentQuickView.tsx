'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Phone, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminStudentRow } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatDate, formatKzt } from '@/lib/format';
import { daysUntil, paymentBadgeClass, paymentLabel } from '@/lib/payment-status';
import { waChatLink } from '@/lib/constants';

const STATUS_LABEL: Record<string, string> = {
  active: 'Учится',
  paused: 'Приостановлено',
  left: 'Ушёл',
};

/** Карточка-«глянуть быстро» — открывается по клику на ученика с дашборда, без перехода на страницу учеников. */
export function StudentQuickView({ studentId, onClose }: { studentId: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-student-quick', studentId],
    queryFn: () => api.get<AdminStudentRow>(`/admin/students/${studentId}`),
    enabled: !!studentId,
  });

  const days = data?.next_payment_estimate ? daysUntil(data.next_payment_estimate) : null;
  const primaryParent = data?.parents[0];

  return (
    <Sheet open={!!studentId} onClose={onClose} title={data?.full_name ?? 'Ученик'}>
      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge
              tone={data.status === 'active' ? 'positive' : data.status === 'paused' ? 'neutral' : 'negative'}
              label={data.is_active ? (STATUS_LABEL[data.status] ?? data.status) : 'Отчислен'}
            />
            <span className="flex items-center gap-1.5 font-display text-lg font-semibold text-white">
              <CoinIcon className="size-5" />
              {data.coins_balance}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-lavender">Группа</p>
              <p className="text-white">{data.group_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-lavender">Филиал</p>
              <p className="text-white">{data.branch_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-lavender">Телефон</p>
              {data.phone ? (
                <a href={waChatLink(data.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-white hover:underline">
                  <Phone className="size-3.5" aria-hidden /> {data.phone}
                </a>
              ) : (
                <p className="text-white">—</p>
              )}
            </div>
            <div>
              <p className="text-lavender">Осталось уроков</p>
              <p className="text-white">{data.lessons_left ?? '—'}</p>
            </div>
            <div>
              <p className="text-lavender">Посл. оплата</p>
              <p className="text-white">
                {data.last_payment_at ? formatDate(data.last_payment_at) : '—'}
                {data.last_payment_amount ? ` · ${formatKzt(data.last_payment_amount)}` : ''}
              </p>
            </div>
            <div>
              <p className="text-lavender">Следующая оплата</p>
              {days === null ? (
                <p className="text-white">—</p>
              ) : (
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${paymentBadgeClass(days)}`}>
                  {paymentLabel(days)}
                </span>
              )}
            </div>
          </div>

          {data.parents.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm text-lavender">Родители</p>
              <div className="space-y-1.5">
                {data.parents.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-purple-mid px-3 py-2 text-sm">
                    <span className="text-white">{p.full_name}</span>
                    {p.phone && (
                      <a href={waChatLink(p.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-lavender hover:text-white">
                        <Phone className="size-3.5" aria-hidden /> {p.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            href={`/app/admin/students?search=${encodeURIComponent(data.login)}`}
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-mid py-2.5 text-sm text-lavender hover:text-white"
          >
            <KeyRound className="size-3.5" aria-hidden /> Открыть полную карточку
          </Link>
        </div>
      )}
    </Sheet>
  );
}
