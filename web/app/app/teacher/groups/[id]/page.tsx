'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { KeyRound, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import type { GroupDetail } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/format';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.get<GroupDetail>(`/teacher/groups/${id}`),
  });

  const [pinFor, setPinFor] = useState<{ id: string; name: string } | null>(null);
  const [newPin, setNewPin] = useState<string | null>(null);

  const resetPin = useMutation({
    mutationFn: (studentId: string) => api.post<{ pin: string }>(`/teacher/students/${studentId}/reset-pin`),
    onSuccess: (res) => setNewPin(res.pin),
  });

  if (isLoading || !data) {
    return (
      <>
        <TopBar title="Группа" />
        <SkeletonCard />
      </>
    );
  }

  return (
    <>
      <TopBar title={data.group.name} />
      <p className="-mt-3 mb-4 text-sm text-lavender">{data.group.course_name}</p>

      <Link href={`/app/teacher/homework/new?groupId=${id}`}>
        <Button variant="secondary" fullWidth className="mb-4">
          <ClipboardList className="size-4" aria-hidden /> Задать домашку
        </Button>
      </Link>

      <div className="space-y-2">
        {data.students.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{s.full_name}</p>
                <p className="text-sm text-lavender">
                  {s.coins_balance} коинов · {s.attendance_pct ?? '—'}% посещаемость
                </p>
              </div>
              <button
                onClick={() => {
                  setPinFor({ id: s.id, name: s.full_name });
                  setNewPin(null);
                }}
                className="flex size-9 items-center justify-center rounded-full text-lavender hover:bg-white/5 hover:text-white"
                aria-label={`Сбросить PIN у ${s.full_name}`}
              >
                <KeyRound className="size-4" aria-hidden />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {data.recentLessons.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-lavender">Последние уроки</p>
          <div className="space-y-2">
            {data.recentLessons.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span className="text-white">{formatDate(l.scheduled_at)}</span>
                <span className="text-lavender">{l.topic ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Sheet open={!!pinFor} onClose={() => setPinFor(null)} title={pinFor ? `PIN: ${pinFor.name}` : ''}>
        {!newPin ? (
          <>
            <p className="mb-4 text-sm text-lavender">Старый PIN перестанет работать сразу после сброса.</p>
            <Button fullWidth loading={resetPin.isPending} onClick={() => pinFor && resetPin.mutate(pinFor.id)}>
              Сбросить PIN
            </Button>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm text-lavender">Новый PIN — покажи один раз, дальше только новый сброс:</p>
            <p className="mb-4 text-center font-display text-4xl font-bold tracking-widest text-white">{newPin}</p>
            <Button fullWidth onClick={() => setPinFor(null)}>
              Готово
            </Button>
          </>
        )}
      </Sheet>
    </>
  );
}
