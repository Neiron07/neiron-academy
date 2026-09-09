'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminStudentRow } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

const METHODS = [
  { id: 'kaspi', label: 'Kaspi' },
  { id: 'cash', label: 'Наличные' },
  { id: 'transfer', label: 'Перевод' },
] as const;

export function CreatePaymentForm() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [lessons, setLessons] = useState('8');
  const [method, setMethod] = useState<(typeof METHODS)[number]['id']>('kaspi');
  const [comment, setComment] = useState('');

  const { data: students } = useQuery({
    queryKey: ['admin-students-search', search],
    queryFn: () => api.get<AdminStudentRow[]>(`/admin/students?search=${encodeURIComponent(search)}`),
    enabled: search.length >= 2,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/payments', {
        student_id: studentId,
        amount_kzt: Number(amount),
        lessons_count: Number(lessons),
        method,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast('Оплата сохранена', 'success');
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      setAmount('');
      setComment('');
      setStudentId('');
      setSearch('');
    },
    onError: () => toast('Не удалось сохранить оплату', 'error'),
  });

  return (
    <Card className="mb-6 max-w-md">
      <p className="mb-3 font-medium text-white">Новая оплата</p>
      <div className="space-y-3">
        <div>
          <span className="mb-1.5 block text-sm text-lavender">Ученик</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setStudentId('');
            }}
            placeholder="Начните вводить имя"
            className="h-11 w-full rounded-xl border border-purple-mid bg-transparent px-3 text-white placeholder:text-muted outline-none focus:border-purple"
          />
          {search.length >= 2 && students && students.length > 0 && !studentId && (
            <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-purple-mid">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setStudentId(s.id);
                    setSearch(s.full_name);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                >
                  {s.full_name}
                </button>
              ))}
            </div>
          )}
        </div>
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
        <Button
          fullWidth
          disabled={!studentId || !amount || !lessons}
          loading={create.isPending}
          onClick={() => create.mutate()}
        >
          Сохранить
        </Button>
      </div>
    </Card>
  );
}
