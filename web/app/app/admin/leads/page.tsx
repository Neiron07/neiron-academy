'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone } from 'lucide-react';
import { api } from '@/lib/api';
import type { Lead, LeadStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { formatRelativeDateTime } from '@/lib/format';
import { Kanban } from 'lucide-react';

const COLUMNS: { id: LeadStatus; label: string }[] = [
  { id: 'new', label: 'Новые' },
  { id: 'contacted', label: 'Связались' },
  { id: 'trial', label: 'Пробный' },
  { id: 'won', label: 'Записались' },
  { id: 'lost', label: 'Отказ' },
];

export default function AdminLeadsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: () => api.get<Lead[]>('/admin/leads'),
  });

  const move = useMutation({
    mutationFn: (p: { id: string; status: LeadStatus }) => api.patch(`/admin/leads/${p.id}`, { status: p.status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leads'] }),
  });

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold text-white">Лиды</h1>
      {isLoading && <SkeletonCard />}
      {data?.length === 0 && <EmptyState icon={Kanban} title="Заявок пока нет" />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = data?.filter((l) => l.status === col.id) ?? [];
          return (
            <div key={col.id}>
              <p className="mb-2 flex items-center justify-between text-sm font-medium text-lavender">
                {col.label} <span className="text-muted">{items.length}</span>
              </p>
              <div className="space-y-2">
                {items.map((lead) => (
                  <Card key={lead.id}>
                    <p className="font-medium text-white">{lead.name}</p>
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm text-lavender hover:text-white">
                      <Phone className="size-3.5" aria-hidden /> {lead.phone}
                    </a>
                    {lead.course_slug && <p className="mt-1 text-sm text-muted">{lead.course_slug}</p>}
                    <p className="mt-1 text-xs text-muted">{formatRelativeDateTime(lead.created_at)}</p>
                    <select
                      value={lead.status}
                      onChange={(e) => move.mutate({ id: lead.id, status: e.target.value as LeadStatus })}
                      className="mt-2 h-9 w-full rounded-lg border border-purple-mid bg-transparent px-2 text-sm text-white outline-none"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
