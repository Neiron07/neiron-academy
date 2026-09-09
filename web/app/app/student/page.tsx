'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import type { StudentProfile } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { CoinBalance } from '@/components/ui/CoinBalance';
import { Glow } from '@/components/ui/Glow';
import { MascotSvg } from '@/components/mascot/MascotSvg';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { formatRelativeDateTime } from '@/lib/format';

export default function StudentHomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => api.get<StudentProfile>('/me/profile'),
  });

  if (isLoading || !data) {
    return (
      <>
        <TopBar title="Профиль" />
        <SkeletonCard />
      </>
    );
  }

  const lessonsToNext = Math.ceil(data.mascot.xpToNextLevel / 15);

  return (
    <>
      <TopBar title={`Привет, ${data.name.split(' ')[0]}`} />

      <div className="relative flex flex-col items-center py-4">
        <Glow className="left-1/2 top-4 size-72 -translate-x-1/2" />
        <Link href="/app/student/inventory" className="relative z-10">
          <MascotSvg stageCode={data.mascot.stageCode} frame={data.equipped.frame} />
        </Link>
        <p className="relative z-10 mt-2 font-display text-lg font-semibold text-white">{data.mascot.stageTitle}</p>

        <div className="relative z-10 mt-3 w-full max-w-xs">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-purple-mid/40">
            <div className="h-full rounded-full bg-purple transition-[width]" style={{ width: `${data.mascot.progressPercent}%` }} />
          </div>
          <p className="mt-2 text-center text-sm text-lavender">
            {data.mascot.isMax
              ? 'Максимальный уровень достигнут'
              : `До эволюции ${data.mascot.xpToNextLevel} XP — это примерно ${lessonsToNext} занятий`}
          </p>
        </div>
      </div>

      <div className="my-5 flex justify-center">
        <Link href="/app/student/transactions">
          <CoinBalance value={data.coins} />
        </Link>
      </div>

      {data.nextLesson && (
        <Card className="mb-3">
          <p className="text-sm text-lavender">Ближайший урок</p>
          <p className="font-medium text-white">
            {data.group?.name} · {formatRelativeDateTime(data.nextLesson.scheduled_at)}
          </p>
        </Card>
      )}

      {data.pendingHomeworkCount > 0 && (
        <Link href="/app/student/homework">
          <Card className="mb-3 flex items-center justify-between">
            <span className="text-white">Несданных домашек: {data.pendingHomeworkCount}</span>
            <ChevronRight className="size-5 text-muted" aria-hidden />
          </Card>
        </Link>
      )}

      {data.achievements.length > 0 && (
        <div className="mb-3">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-lavender">
            <Sparkles className="size-4" aria-hidden /> Последние ачивки
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {data.achievements.slice(0, 6).map((a) => (
              <div key={a.code} className="flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl border border-purple-mid p-2 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-purple text-white">🏆</div>
                <span className="text-xs text-white">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
