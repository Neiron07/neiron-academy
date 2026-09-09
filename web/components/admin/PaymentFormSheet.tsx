'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { Payment } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const METHODS = [
  { id: 'kaspi', label: 'Kaspi' },
  { id: 'cash', label: 'Наличные' },
  { id: 'transfer', label: 'Перевод' },
] as const;

export function PaymentFormSheet({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();

  const [amount, setAmount] = useState('');
  const [lessons, setLessons] = useState('');
  const [method, setMethod] = useState<(typeof METHODS)[number]['id']>('kaspi');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!payment) return;
    setAmount(String(payment.amount_kzt));
    setLessons(String(payment.lessons_count));
    setMethod(payment.method);
    setComment(payment.comment ?? '');
    setError('');
  }, [payment]);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/admin/payments/${payment!.id}`, {
        amount_kzt: Number(amount),
        lessons_count: Number(lessons),
        method,
        comment: comment.trim() || null,
      }),
    onSuccess: () => {
      toast('Оплата обновлена', 'success');
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      onClose();
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : 'Не удалось сохранить';
      setError(message);
      toast(message, 'error');
    },
  });

  return (
    <Sheet open={!!payment} onClose={onClose} title={payment ? `Оплата: ${payment.student_name}` : ''}>
      <div className="space-y-3">
        <div className="flex gap-3">
          <Input label="Сумма, ₸" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1" />
          <Input label="Уроков" type="number" value={lessons} onChange={(e) => setLessons(e.target.value)} className="w-24" />
        </div>
        <div className="flex gap-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex-1 rounded-lg border py-2 text-sm ${method === m.id ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Input label="Комментарий (необязательно)" value={comment} onChange={(e) => setComment(e.target.value)} />
        {error && <p className="text-sm text-white">{error}</p>}
        <Button fullWidth disabled={!amount || !lessons} loading={save.isPending} onClick={() => save.mutate()}>
          Сохранить
        </Button>
      </div>
    </Sheet>
  );
}
