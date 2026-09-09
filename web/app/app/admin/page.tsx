'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Phone, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminDashboard } from '@/lib/types';
import { Card, InvertCard } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatKzt, formatRelativeDateTime } from '@/lib/format';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<AdminDashboard>('/admin/dashboard'),
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-white">Дашборд</h1>

      {data.notClosed.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-white">
            <AlertTriangle className="size-4" aria-hidden /> Незакрытые уроки
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {data.notClosed.map((l) => (
              <InvertCard key={l.id}>
                <p className="font-medium">{l.group_name}</p>
                <p className="text-sm opacity-70">
                  {l.teacher ?? 'без преподавателя'} · {formatRelativeDateTime(l.scheduled_at)}
                </p>
              </InvertCard>
            ))}
          </div>
        </section>
      )}

      {data.atRisk.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-medium text-lavender">Зона риска — 2+ пропуска подряд</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {data.atRisk.map((s) =>
              s.risk_level === 'critical' ? (
                <InvertCard key={s.student_id}>
                  <p className="font-medium">{s.full_name}</p>
                  <p className="mb-2 text-sm opacity-70">Пропустил {s.miss_last3} из последних 3 уроков</p>
                  <RiskActions name={s.full_name} invert />
                </InvertCard>
              ) : (
                <Card key={s.student_id} className="border-purple">
                  <p className="font-medium text-white">{s.full_name}</p>
                  <p className="mb-2 text-sm text-lavender">Пропустил {s.miss_last2} из последних 2 уроков</p>
                  <RiskActions name={s.full_name} />
                </Card>
              ),
            )}
          </div>
        </section>
      )}

      {data.debtors.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-medium text-lavender">Заканчивается абонемент</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
            {data.debtors.map((d) => (
              <Card key={d.id} className="flex items-center justify-between">
                <span className="text-white">{d.full_name}</span>
                <StatusBadge tone={d.lessons_left <= 0 ? 'negative' : 'neutral'} label={`${d.lessons_left} ост.`} />
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-lavender">Уроков сегодня</p>
          <p className="font-display text-2xl font-bold text-white">
            {data.lessonsToday.completed}/{data.lessonsToday.completed + data.lessonsToday.planned}
          </p>
          <p className="text-sm text-muted">проведено</p>
        </Card>
        <Card>
          <p className="text-sm text-lavender">Выручка за месяц</p>
          <p className="font-display text-2xl font-bold text-white">{formatKzt(data.money.revenue_month)}</p>
          <p className="text-sm text-muted">{data.money.payments_count} оплат</p>
        </Card>
        <Card>
          <p className="text-sm text-lavender">Заказы к выдаче</p>
          <p className="font-display text-2xl font-bold text-white">{data.pendingOrders}</p>
        </Card>
        <Card>
          <p className="text-sm text-lavender">Новые лиды</p>
          <Link href="/app/admin/leads" className="font-display text-2xl font-bold text-white hover:underline">
            {data.newLeads}
          </Link>
        </Card>
      </div>

      <section>
        <p className="mb-2 text-sm font-medium text-lavender">Загрузка групп</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {data.groups.map((g) => (
            <Card key={g.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{g.name}</p>
                <p className="text-xs text-muted">{g.course_name}</p>
              </div>
              <span className={`font-display text-sm font-semibold ${g.filled >= g.capacity ? 'text-white' : 'text-lavender'}`}>
                {g.filled}/{g.capacity}
              </span>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * v_at_risk не отдаёт телефон родителя — только имя ученика. Ведём в карточку
 * ученика в разделе «Ученики», где телефон уже есть (поле parents).
 */
function RiskActions({ name, invert }: { name: string; invert?: boolean }) {
  const cls = invert ? 'border-bg/30 text-bg' : 'border-purple-mid text-lavender';
  return (
    <Link
      href={`/app/admin/students?search=${encodeURIComponent(name)}`}
      className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-sm ${cls}`}
    >
      <Phone className="size-3.5" aria-hidden /> Найти контакты родителя
    </Link>
  );
}
