'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Coins, Search, KeyRound, Pencil, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { AdminStudentRow } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateStudentSheet } from '@/components/admin/CreateStudentSheet';
import { CoinsAdjustSheet } from '@/components/admin/CoinsAdjustSheet';
import { StudentFormSheet } from '@/components/admin/StudentFormSheet';
import { ResetPinSheet, type ResetPinTarget } from '@/components/admin/ResetPinSheet';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatKzt } from '@/lib/format';
import { daysUntil, paymentBadgeClass, paymentLabel } from '@/lib/payment-status';
import { waChatLink } from '@/lib/constants';
import { Users } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  active: 'Учится',
  paused: 'Приостановлено',
  left: 'Ушёл',
};

function StudentsContent() {
  const qc = useQueryClient();
  const toast = useToast();
  const initialSearch = useSearchParams().get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [createOpen, setCreateOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<AdminStudentRow | null>(null);
  const [adjustFor, setAdjustFor] = useState<{ id: string; name: string } | null>(null);
  const [pinFor, setPinFor] = useState<ResetPinTarget | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search],
    queryFn: () => api.get<AdminStudentRow[]>(`/admin/students${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/students/${id}`),
    onSuccess: () => {
      toast('Ученик удалён', 'success');
      qc.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось удалить ученика', 'error'),
  });

  function handleDelete(s: AdminStudentRow) {
    if (window.confirm(`Удалить ${s.full_name}? Это необратимо.`)) remove.mutate(s.id);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">Ученики</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden /> Добавить ученика
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Имя или логин"
          className="h-11 w-full rounded-xl border border-purple-mid bg-transparent pl-9 pr-3 text-white placeholder:text-muted outline-none focus:border-purple"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data?.length === 0 && <EmptyState icon={Users} title="Никого не нашли" />}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-purple-mid">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-purple-mid text-lavender">
                <th className="px-4 py-3 font-medium">Ученик</th>
                <th className="px-4 py-3 font-medium">Филиал</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Группа</th>
                <th className="px-4 py-3 font-medium">Присоединился</th>
                <th className="px-4 py-3 font-medium">Учится</th>
                <th className="px-4 py-3 font-medium">Оплата в месяц</th>
                <th className="px-4 py-3 font-medium">Всего оплачено</th>
                <th className="px-4 py-3 font-medium">Посл. оплата</th>
                <th className="px-4 py-3 font-medium">След. оплата</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((s) => {
                const primaryParent = s.parents[0];
                const days = s.next_payment_estimate ? daysUntil(s.next_payment_estimate) : null;
                return (
                  <tr key={s.id} className={`border-b border-purple-mid/40 last:border-0 ${!s.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-white">{s.full_name}</p>
                      <p className="text-xs text-muted">{s.login}</p>
                    </td>
                    <td className="px-4 py-3 text-lavender">{s.branch_name ?? '—'}</td>
                    <td className="px-4 py-3 text-lavender">
                      {s.phone ? (
                        <a href={waChatLink(s.phone)} target="_blank" rel="noreferrer" className="text-lavender hover:text-white hover:underline">
                          {s.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                      {primaryParent && (
                        <button
                          onClick={() => setPinFor({ id: primaryParent.id, name: primaryParent.full_name, phone: primaryParent.phone })}
                          className="ml-1 text-lavender hover:text-white"
                          aria-label={`Сбросить PIN у ${primaryParent.full_name}`}
                          title="Сбросить PIN родителя"
                        >
                          <KeyRound className="inline size-3.5" aria-hidden />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-lavender">{s.group_name ?? '—'}</td>
                    <td className="px-4 py-3 text-lavender">{s.joined_at ? formatDate(s.joined_at) : '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={s.status === 'active' ? 'positive' : s.status === 'paused' ? 'neutral' : 'negative'}
                        label={s.is_active ? (STATUS_LABEL[s.status] ?? s.status) : 'Отчислен'}
                      />
                    </td>
                    <td className="px-4 py-3 text-white">{s.last_payment_amount ? formatKzt(s.last_payment_amount) : '—'}</td>
                    <td className="px-4 py-3 text-white">{s.total_paid ? formatKzt(s.total_paid) : '—'}</td>
                    <td className="px-4 py-3 text-lavender">{s.last_payment_at ? formatDate(s.last_payment_at) : '—'}</td>
                    <td className="px-4 py-3">
                      {days === null ? (
                        <span className="text-lavender">—</span>
                      ) : (
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${paymentBadgeClass(days)}`}>
                          {paymentLabel(days)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setPinFor({ id: s.id, name: s.full_name, phone: primaryParent?.phone, login: s.login })}
                          className="flex items-center gap-1 rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender hover:text-white"
                          title="Сбросить PIN"
                        >
                          <KeyRound className="size-3.5" aria-hidden />
                        </button>
                        <button
                          onClick={() => setAdjustFor({ id: s.id, name: s.full_name })}
                          className="flex items-center gap-1 rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender hover:text-white"
                          title="Коины"
                        >
                          <Coins className="size-3.5" aria-hidden />
                        </button>
                        <button
                          onClick={() => setEditStudent(s)}
                          className="flex items-center gap-1 rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender hover:text-white"
                          title="Изменить"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="flex items-center gap-1 rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender hover:text-white"
                          title="Удалить"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateStudentSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <StudentFormSheet student={editStudent} onClose={() => setEditStudent(null)} />
      <CoinsAdjustSheet studentId={adjustFor?.id ?? null} studentName={adjustFor?.name ?? ''} onClose={() => setAdjustFor(null)} />
      <ResetPinSheet target={pinFor} onClose={() => setPinFor(null)} />
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense>
      <StudentsContent />
    </Suspense>
  );
}
