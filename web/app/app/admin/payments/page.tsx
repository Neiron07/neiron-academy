'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import type { Payment } from '@/lib/types';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreatePaymentForm } from '@/components/admin/CreatePaymentForm';
import { formatDate, formatKzt } from '@/lib/format';

const METHOD_LABEL: Record<string, string> = { kaspi: 'Kaspi', cash: 'Наличные', transfer: 'Перевод' };

export default function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => api.get<Payment[]>('/admin/payments'),
  });

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold text-white">Оплаты</h1>
      <CreatePaymentForm />

      {isLoading && <SkeletonRow />}
      {data?.length === 0 && <EmptyState icon={Wallet} title="Оплат пока нет" />}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-purple-mid">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-purple-mid text-lavender">
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Ученик</th>
                <th className="px-4 py-3 font-medium">Сумма</th>
                <th className="px-4 py-3 font-medium">Уроков</th>
                <th className="px-4 py-3 font-medium">Способ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-purple-mid/40 last:border-0">
                  <td className="px-4 py-3 text-lavender">{formatDate(p.paid_at)}</td>
                  <td className="px-4 py-3 text-white">{p.student_name}</td>
                  <td className="px-4 py-3 text-white">{formatKzt(p.amount_kzt)}</td>
                  <td className="px-4 py-3 text-lavender">{p.lessons_count}</td>
                  <td className="px-4 py-3 text-lavender">{METHOD_LABEL[p.method]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
