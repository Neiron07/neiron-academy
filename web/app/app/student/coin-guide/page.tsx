'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, ShieldCheck, ListChecks, Medal, Flame, BookOpenCheck, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import type { CoinRules } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { SkeletonRow } from '@/components/ui/Skeleton';

const ITEMS: { key: keyof CoinRules; icon: LucideIcon; title: string; text: string }[] = [
  { key: 'attendance', icon: CheckCircle2, title: 'Пришёл на урок', text: 'За каждое посещение занятия' },
  { key: 'punctual', icon: Clock3, title: 'Пришёл вовремя', text: 'Дополнительно, если не опоздал' },
  { key: 'homework_on_time', icon: ListChecks, title: 'Домашка в срок', text: 'Сдал и её приняли до дедлайна' },
  { key: 'homework_late', icon: ListChecks, title: 'Домашка с опозданием', text: 'Приняли, но после дедлайна — меньше коинов' },
  { key: 'homework_excellent', icon: Medal, title: 'Домашка на «отлично»', text: 'Надбавка сверху, если сделал особенно хорошо' },
  { key: 'streak_4', icon: Flame, title: 'Без пропусков подряд', text: '4 урока подряд без пропусков' },
  { key: 'module_done', icon: BookOpenCheck, title: 'Завершил модуль курса', text: 'Прошёл целый блок тем' },
  { key: 'course_done', icon: GraduationCap, title: 'Завершил курс', text: 'Прошёл курс целиком' },
  { key: 'cancelled_by_school', icon: ShieldCheck, title: 'Урок отменила школа', text: 'Ты не виноват — коины всё равно начислят' },
];

export default function CoinGuidePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['coin-rules'],
    queryFn: () => api.get<CoinRules>('/me/coin-rules'),
  });

  return (
    <>
      <TopBar title="За что дают коины?" />
      <p className="-mt-3 mb-4 text-sm text-lavender">
        Учись, старайся и не пропускай уроки — коины копятся сами. Плюс преподаватель может начислить их вручную за активность на уроке.
      </p>

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {data && (
        <div className="space-y-2">
          {ITEMS.map((item) => {
            const rule = data[item.key];
            const Icon = item.icon;
            return (
              <Card key={item.key} className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple/15 text-purple">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-sm text-lavender">{item.text}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 font-display font-semibold text-white">
                  +{rule.coins} <CoinIcon className="size-4" />
                </span>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
