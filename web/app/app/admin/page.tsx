'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Phone, AlertTriangle, Wallet, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminDashboard } from '@/lib/types';
import { Card, InvertCard } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StudentQuickView } from '@/components/admin/StudentQuickView';
import { formatKzt, formatRelativeDateTime, formatDate, formatTime } from '@/lib/format';
import { paymentBadgeClass, paymentLabel } from '@/lib/payment-status';
import { TRIAL_CLASSES } from '@/lib/calendar';

export default function AdminDashboardPage() {
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
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

      {data.upcomingTrials.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-lavender">
              <Sparkles className="size-4" aria-hidden /> Ближайшие пробные уроки
            </p>
            <Link href="/app/admin/calendar" className="text-sm text-lavender hover:text-white">
              Календарь →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {data.upcomingTrials.map((t) => (
              <Card key={t.id} className={`${TRIAL_CLASSES.border} ${TRIAL_CLASSES.bg}`}>
                <p className="font-medium text-white">{t.title}</p>
                <p className={`text-sm ${TRIAL_CLASSES.text}`}>
                  {formatDate(t.starts_at)} · {formatTime(t.starts_at)}
                </p>
                <p className="mt-1 text-sm text-lavender">
                  {t.teacher_name ?? 'без преподавателя'}
                  {t.room && ` · ${t.room}`}
                </p>
                {(t.contact_name || t.contact_phone) && (
                  <p className="mt-1 text-xs text-muted">
                    {t.contact_name}
                    {t.contact_name && t.contact_phone && ' · '}
                    {t.contact_phone}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

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
                  <button onClick={() => setQuickViewId(s.student_id)} className="block text-left font-medium hover:underline">
                    {s.full_name}
                  </button>
                  <p className="mb-2 text-sm opacity-70">Пропустил {s.miss_last3} из последних 3 уроков</p>
                  <RiskActions name={s.full_name} invert />
                </InvertCard>
              ) : (
                <Card key={s.student_id} className="border-purple">
                  <button onClick={() => setQuickViewId(s.student_id)} className="block text-left font-medium text-white hover:underline">
                    {s.full_name}
                  </button>
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
                <button onClick={() => setQuickViewId(d.id)} className="text-white hover:underline">
                  {d.full_name}
                </button>
                <StatusBadge tone={d.lessons_left <= 0 ? 'negative' : 'neutral'} label={`${d.lessons_left} ост.`} />
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-lavender">Учеников</p>
          <p className="font-display text-2xl font-bold text-white">{data.totalStudents}</p>
        </Card>
        <Card>
          <p className="text-sm text-lavender">Групп</p>
          <p className="font-display text-2xl font-bold text-white">{data.groups.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-lavender">Свободных мест</p>
          <p className="font-display text-2xl font-bold text-white">
            {data.groups.reduce((sum, g) => sum + Math.max(0, g.capacity - g.filled), 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-lavender">Просрочено оплат</p>
          <p className="font-display text-2xl font-bold text-white">{data.paymentsDue.filter((p) => p.days < 0).length}</p>
        </Card>
      </div>

      {data.paymentsDue.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-lavender">
              <Wallet className="size-4" aria-hidden /> Оплаты — требуют внимания
            </p>
            <Link href="/app/admin/students" className="text-sm text-lavender hover:text-white">
              Все ученики →
            </Link>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-purple-mid">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-purple-mid text-lavender">
                  <th className="px-4 py-3 font-medium">Ученик</th>
                  <th className="px-4 py-3 font-medium">Сумма</th>
                  <th className="px-4 py-3 font-medium">Следующая оплата (план)</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentsDue.map((p) => (
                  <tr key={p.id} className="border-b border-purple-mid/40 last:border-0">
                    <td className="px-4 py-3">
                      <button onClick={() => setQuickViewId(p.id)} className="text-white hover:underline">
                        {p.full_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-white">{p.amount ? formatKzt(p.amount) : '—'}</td>
                    <td className="px-4 py-3 text-lavender">{formatRelativeDateTime(p.next_payment_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${paymentBadgeClass(p.days)}`}>
                        {paymentLabel(p.days)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <p className="mb-2 text-sm font-medium text-lavender">
          Загрузка групп <span className="text-muted">— видно, в какие есть места и когда занятия</span>
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {data.groups.map((g) => (
            <Card key={g.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{g.name}</p>
                <p className="text-xs text-muted">{g.course_name}</p>
                <p className="mt-0.5 text-xs text-lavender">{scheduleLabel(g.schedule)}</p>
              </div>
              <span className={`shrink-0 font-display text-sm font-semibold ${g.filled >= g.capacity ? 'text-white' : 'text-lavender'}`}>
                {g.filled}/{g.capacity}
              </span>
            </Card>
          ))}
        </div>
      </section>

      <StudentQuickView studentId={quickViewId} onClose={() => setQuickViewId(null)} />
    </div>
  );
}

const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/** «Пн, Ср · 16:00» — сгруппировано по времени, чтобы не плодить строки при одинаковом слоте в разные дни. */
function scheduleLabel(schedule: { weekday: number; start_time: string }[]): string {
  if (schedule.length === 0) return 'Расписание не задано';
  const byTime = new Map<string, number[]>();
  for (const s of schedule) {
    const time = s.start_time.slice(0, 5);
    if (!byTime.has(time)) byTime.set(time, []);
    byTime.get(time)!.push(s.weekday);
  }
  return [...byTime.entries()]
    .map(([time, weekdays]) => `${weekdays.sort((a, b) => a - b).map((w) => WEEKDAY_SHORT[w - 1]).join(', ')} · ${time}`)
    .join('; ');
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
