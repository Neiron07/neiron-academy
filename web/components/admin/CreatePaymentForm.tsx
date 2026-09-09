'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
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
  const [error, setError] = useState('');

  // Список сразу видно — не нужно ничего печатать, чтобы выбрать ученика.
  const { data: students } = useQuery({
    queryKey: ['admin-students'],
    queryFn: () => api.get<AdminStudentRow[]>('/admin/students'),
  });

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.trim().toLowerCase();
    const list = q ? students.filter((s) => s.full_name.toLowerCase().includes(q)) : students;
    return list.slice(0, 30);
  }, [students, search]);

  const selected = students?.find((s) => s.id === studentId);

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
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      setAmount('');
      setComment('');
      setStudentId('');
      setSearch('');
      setError('');
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : 'Не удалось сохранить оплату';
      setError(message);
      toast(message, 'error');
    },
  });

  return (
    <Card className="mb-6 max-w-md">
      <p className="mb-3 font-medium text-white">Новая оплата</p>
      <div className="space-y-3">
        <div>
          <span className="mb-1.5 block text-sm text-lavender">Ученик</span>
          {selected ? (
            <button
              onClick={() => {
                setStudentId('');
                setSearch('');
              }}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-purple bg-purple/10 px-3 text-left text-sm text-white"
            >
              {selected.full_name}
              <span className="text-xs text-lavender">изменить</span>
            </button>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск или выбери из списка"
                  className="h-11 w-full rounded-xl border border-purple-mid bg-transparent pl-9 pr-3 text-sm text-white placeholder:text-muted outline-none focus:border-purple"
                />
              </div>
              <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-purple-mid">
                {filtered.length === 0 && <p className="px-3 py-2 text-sm text-muted">Никого не нашли</p>}
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setStudentId(s.id);
                      setSearch('');
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                  >
                    {s.full_name}
                    {s.group_name && <span className="text-xs text-muted">{s.group_name}</span>}
                  </button>
                ))}
              </div>
            </>
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
        {error && <p className="text-sm text-white">{error}</p>}
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
