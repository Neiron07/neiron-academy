'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function CoinsAdjustSheet({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string | null;
  studentName: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [coins, setCoins] = useState('');
  const [reason, setReason] = useState('');

  const adjust = useMutation({
    mutationFn: () => api.post('/admin/coins/adjust', { student_id: studentId, coins: Number(coins), reason: reason.trim() }),
    onSuccess: () => {
      toast('Баланс скорректирован', 'success');
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      setCoins('');
      setReason('');
      onClose();
    },
    onError: () => toast('Не удалось скорректировать', 'error'),
  });

  return (
    <Sheet open={!!studentId} onClose={onClose} title={`Коррекция коинов: ${studentName}`}>
      <p className="mb-4 text-sm text-lavender">
        Это компенсирующая транзакция, а не правка истории — она добавится отдельной строкой в ленту коинов ученика.
      </p>
      <label className="mb-3 block">
        <span className="mb-1.5 block text-sm text-lavender">Коины (можно отрицательное число)</span>
        <input
          type="number"
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
          className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
        />
      </label>
      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm text-lavender">Причина</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
        />
      </label>
      <Button
        fullWidth
        loading={adjust.isPending}
        disabled={!coins || Number(coins) === 0 || reason.trim().length < 3}
        onClick={() => adjust.mutate()}
      >
        Применить
      </Button>
    </Sheet>
  );
}
