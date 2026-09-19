'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Sparkles, Lock, Mail } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { StudentProfile } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CoinBalance } from '@/components/ui/CoinBalance';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { Glow } from '@/components/ui/Glow';
import { MascotSvg } from '@/components/mascot/MascotSvg';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatRelativeDateTime } from '@/lib/format';
import { getDailyMessage } from '@/lib/motivational-messages';

const MASCOT_UNLOCK_COST = 100;

export default function StudentHomePage() {
  const qc = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => api.get<StudentProfile>('/me/profile'),
  });

  const unlock = useMutation({
    mutationFn: () => api.post('/me/mascot/unlock'),
    onSuccess: () => {
      toast('Твой помощник открыт!', 'success');
      qc.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось открыть помощника', 'error'),
  });

  const message = useMemo(() => (data ? getDailyMessage(data.gender, data.name) : ''), [data]);

  if (isLoading || !data) {
    return (
      <>
        <TopBar title="Профиль" />
        <SkeletonCard />
      </>
    );
  }

  const lessonsToNext = Math.ceil(data.mascot.xpToNextLevel / 15);
  const canUnlock = data.coins >= MASCOT_UNLOCK_COST;

  return (
    <>
      <TopBar title={`Привет, ${data.name.split(' ')[0]}`} />

      <Card className="mb-4 border-purple bg-purple/10">
        <div className="flex items-start gap-2.5">
          <Mail className="mt-0.5 size-5 shrink-0 text-purple" aria-hidden />
          <div>
            <p className="text-sm font-medium text-lavender">Письмо для тебя</p>
            <p className="mt-1 text-white">{message}</p>
          </div>
        </div>
      </Card>

      <div className="relative flex flex-col items-center py-4">
        <Glow className="left-1/2 top-4 size-72 -translate-x-1/2" />

        {data.mascotUnlocked ? (
          <>
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
          </>
        ) : (
          <>
            <div className="relative z-10">
              <div className="opacity-30 grayscale">
                <MascotSvg stageCode="egg" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="size-10 text-white" aria-hidden />
              </div>
            </div>
            <p className="relative z-10 mt-3 text-center font-display text-lg font-semibold text-white">
              Открой своего помощника
            </p>
            <p className="relative z-10 mt-1 max-w-xs text-center text-sm text-lavender">
              Нейрон будет расти вместе с тобой и меняться с каждым уровнем — но сначала его нужно открыть
            </p>
            <Button
              className="relative z-10 mt-4"
              size="lg"
              disabled={!canUnlock}
              loading={unlock.isPending}
              onClick={() => unlock.mutate()}
            >
              <CoinIcon className="size-5" /> Открыть за {MASCOT_UNLOCK_COST}
            </Button>
            {!canUnlock && (
              <p className="relative z-10 mt-2 text-sm text-muted">Не хватает {MASCOT_UNLOCK_COST - data.coins} коинов</p>
            )}
          </>
        )}
      </div>

      <div className="my-5 flex flex-col items-center gap-1.5">
        <Link href="/app/student/transactions">
          <CoinBalance value={data.coins} />
        </Link>
        <Link href="/app/student/coin-guide" className="text-sm text-purple hover:underline">
          За что дают коины?
        </Link>
      </div>

      {data.nextLesson && (
        <Link href="/app/student/schedule">
          <Card className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-lavender">Ближайший урок</p>
              <p className="font-medium text-white">
                {data.group?.name} · {formatRelativeDateTime(data.nextLesson.scheduled_at)}
              </p>
              {data.nextLesson.topic && <p className="mt-0.5 truncate text-sm text-lavender">{data.nextLesson.topic}</p>}
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
          </Card>
        </Link>
      )}

      {data.group?.teacher_id && (
        <Link href={`/app/student/teacher/${data.group.teacher_id}`}>
          <Card className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-lavender">Мой преподаватель</p>
              <p className="font-medium text-white">{data.group.teacher_name}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
          </Card>
        </Link>
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
