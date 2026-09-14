'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminStaff, AuditLogResponse } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeDateTime } from '@/lib/format';
import { ACTION_LABEL, ACTION_CATEGORIES } from '@/lib/audit-labels';
import { STAFF_ROLE_LABEL } from '@/lib/constants';

const selectClass =
  'h-10 rounded-lg border border-purple-mid bg-transparent px-3 text-sm text-white outline-none focus:border-purple';

function formatDiff(diff: unknown): string {
  if (!diff || typeof diff !== 'object') return '—';
  const entries = Object.entries(diff as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  if (entries.length === 0) return '—';
  const joined = entries.join(', ');
  return joined.length > 160 ? joined.slice(0, 160) + '…' : joined;
}

export default function AdminActivityLogPage() {
  const [actorId, setActorId] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState(100);

  const { data: staff } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get<AdminStaff[]>('/admin/teachers'),
  });

  const params = new URLSearchParams();
  if (actorId) params.set('actor_id', actorId);
  if (category) params.set('action', category);
  if (from) params.set('from', new Date(from).toISOString());
  // Включаем весь день "по", а не только его полночь.
  if (to) params.set('to', new Date(new Date(to).getTime() + 86_399_000).toISOString());
  params.set('limit', String(limit));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-log', actorId, category, from, to, limit],
    queryFn: () => api.get<AuditLogResponse>(`/admin/audit-log?${params.toString()}`),
  });

  function resetPaging<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setLimit(100);
    };
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">Журнал действий</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={actorId} onChange={(e) => resetPaging(setActorId)(e.target.value)} className={selectClass}>
          <option value="">Все сотрудники</option>
          {staff?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => resetPaging(setCategory)(e.target.value)} className={selectClass}>
          <option value="">Все действия</option>
          {ACTION_CATEGORIES.map((c) => (
            <option key={c.prefix} value={c.prefix}>
              {c.label}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => resetPaging(setFrom)(e.target.value)} className={selectClass} />
        <input type="date" value={to} onChange={(e) => resetPaging(setTo)(e.target.value)} className={selectClass} />
      </div>

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data?.rows.length === 0 && <EmptyState icon={History} title="Действий пока нет" />}

      {data && data.rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-purple-mid">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-purple-mid text-lavender">
                <th className="px-4 py-3 font-medium">Время</th>
                <th className="px-4 py-3 font-medium">Сотрудник</th>
                <th className="px-4 py-3 font-medium">Действие</th>
                <th className="px-4 py-3 font-medium">Детали</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="border-b border-purple-mid/40 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-lavender">{formatRelativeDateTime(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <p className="text-white">{r.actor_name ?? '—'}</p>
                    {r.actor_role && (
                      <p className="text-xs text-muted">
                        {STAFF_ROLE_LABEL[r.actor_role as 'admin' | 'teacher' | 'marketer'] ?? r.actor_role}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white">{ACTION_LABEL[r.action] ?? r.action}</td>
                  <td className="max-w-md px-4 py-3 text-muted">{formatDiff(r.diff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.rows.length < data.total && (
        <Button variant="secondary" className="mt-3" onClick={() => setLimit((l) => l + 100)}>
          Показать ещё ({data.total - data.rows.length})
        </Button>
      )}
    </div>
  );
}
