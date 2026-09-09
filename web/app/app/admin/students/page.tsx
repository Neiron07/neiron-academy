'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Coins, Search, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminStudentRow } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateStudentSheet } from '@/components/admin/CreateStudentSheet';
import { CoinsAdjustSheet } from '@/components/admin/CoinsAdjustSheet';
import { ResetPinSheet } from '@/components/admin/ResetPinSheet';
import { Users } from 'lucide-react';

function StudentsContent() {
  const initialSearch = useSearchParams().get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [createOpen, setCreateOpen] = useState(false);
  const [adjustFor, setAdjustFor] = useState<{ id: string; name: string } | null>(null);
  const [pinFor, setPinFor] = useState<{ id: string; name: string } | null>(null);

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
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Логин</th>
                <th className="px-4 py-3 font-medium">Группа</th>
                <th className="px-4 py-3 font-medium">Коины</th>
                <th className="px-4 py-3 font-medium">Осталось уроков</th>
                <th className="px-4 py-3 font-medium">Родители</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-purple-mid/40 last:border-0">
                  <td className="px-4 py-3 text-white">{s.full_name}</td>
                  <td className="px-4 py-3 text-lavender">{s.login}</td>
                  <td className="px-4 py-3 text-lavender">{s.group_name ?? '—'}</td>
                  <td className="px-4 py-3 text-white">{s.coins_balance}</td>
                  <td className="px-4 py-3 text-lavender">{s.lessons_left ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {s.parents.length === 0 && '—'}
                    {s.parents.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && ', '}
                        {p.full_name} ({p.phone})
                        <button
                          onClick={() => setPinFor({ id: p.id, name: p.full_name })}
                          className="ml-1 text-lavender hover:text-white"
                          aria-label={`Сбросить PIN у ${p.full_name}`}
                          title="Сбросить PIN родителя"
                        >
                          <KeyRound className="inline size-3.5" aria-hidden />
                        </button>
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setPinFor({ id: s.id, name: s.full_name })}
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
              ))}
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
