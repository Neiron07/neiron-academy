'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Coins, Search, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminStudentRow } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateStudentSheet } from '@/components/admin/CreateStudentSheet';
import { CoinsAdjustSheet } from '@/components/admin/CoinsAdjustSheet';
import { ResetPinSheet, type ResetPinTarget } from '@/components/admin/ResetPinSheet';
import { formatDate, formatKzt } from '@/lib/format';
import { Users } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  active: 'Учится',
  paused: 'Приостановлено',
  left: 'Ушёл',
};

function StudentsContent() {
  const initialSearch = useSearchParams().get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [createOpen, setCreateOpen] = useState(false);
  const [adjustFor, setAdjustFor] = useState<{ id: string; name: string } | null>(null);
  const [pinFor, setPinFor] = useState<ResetPinTarget | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search],
    queryFn: () => api.get<AdminStudentRow[]>(`/admin/students${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

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
                return (
                  <tr key={s.id} className="border-b border-purple-mid/40 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-white">{s.full_name}</p>
                      <p className="text-xs text-muted">{s.login}</p>
                    </td>
                    <td className="px-4 py-3 text-lavender">{s.branch_name ?? '—'}</td>
                    <td className="px-4 py-3 text-lavender">
                      {s.phone ?? '—'}
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
                        label={STATUS_LABEL[s.status] ?? s.status}
                      />
                    </td>
                    <td className="px-4 py-3 text-white">{s.last_payment_amount ? formatKzt(s.last_payment_amount) : '—'}</td>
                    <td className="px-4 py-3 text-white">{s.total_paid ? formatKzt(s.total_paid) : '—'}</td>
                    <td className="px-4 py-3 text-lavender">{s.last_payment_at ? formatDate(s.last_payment_at) : '—'}</td>
                    <td className="px-4 py-3 text-lavender">{s.next_payment_estimate ? formatDate(s.next_payment_estimate) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setPinFor({ id: s.id, name: s.full_name, phone: primaryParent?.phone, login: s.login })}
                          className="flex items-center gap-1 rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender hover:text-white"
                        >
                          <KeyRound className="size-3.5" aria-hidden /> PIN
                        </button>
                        <button
                          onClick={() => setAdjustFor({ id: s.id, name: s.full_name })}
                          className="flex items-center gap-1 rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender hover:text-white"
                        >
                          <Coins className="size-3.5" aria-hidden /> Коины
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
