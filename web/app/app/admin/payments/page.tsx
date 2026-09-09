'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, Pencil, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Payment } from '@/lib/types';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreatePaymentForm } from '@/components/admin/CreatePaymentForm';
import { PaymentFormSheet } from '@/components/admin/PaymentFormSheet';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatKzt } from '@/lib/format';

const METHOD_LABEL: Record<string, string> = { kaspi: 'Kaspi', cash: 'Наличные', transfer: 'Перевод' };

export default function AdminPaymentsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editPayment, setEditPayment] = useState<Payment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => api.get<Payment[]>('/admin/payments'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/payments/${id}`),
    onSuccess: () => {
      toast('Оплата удалена', 'success');
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось удалить оплату', 'error'),
  });

  function handleDelete(p: Payment) {
    if (window.confirm(`Удалить оплату ${formatKzt(p.amount_kzt)} от ${p.student_name}?`)) remove.mutate(p.id);
  }

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
                <th className="px-4 py-3" />
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
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditPayment(p)}
                        className="flex items-center gap-1 rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender hover:text-white"
                        title="Изменить"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="flex items-center gap-1 rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender hover:text-white"
                        title="Удалить"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaymentFormSheet payment={editPayment} onClose={() => setEditPayment(null)} />
    </div>
  );
}
