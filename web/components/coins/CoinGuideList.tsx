'use client';

import {
  CheckCircle2, ListChecks, HeartHandshake, Rocket, Flame,
  BookOpenCheck, Trophy, Mic2, UserPlus, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CoinGuideItem } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { SkeletonRow } from '@/components/ui/Skeleton';

/**
 * Иконка подбирается по тексту label, а не по жёсткому ключу — гайд теперь
 * приходит с бэка одним списком (COIN_GUIDE в src/lib/rules.ts), это
 * единственное место, которое пришлось бы синхронизировать при добавлении
 * новой категории. Нераспознанный label просто получает иконку по умолчанию.
 */
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/присутствие/i, CheckCircle2],
  [/домашка/i, ListChecks],
  [/активность.*помощь/i, HeartHandshake],
  [/проект/i, Rocket],
  [/без пропусков/i, Flame],
  [/модуль/i, BookOpenCheck],
  [/конкурс/i, Trophy],
  [/демо/i, Mic2],
  [/друга/i, UserPlus],
];

function iconFor(label: string): LucideIcon {
  return ICON_RULES.find(([re]) => re.test(label))?.[1] ?? Sparkles;
}

export function CoinGuideList({ items, isLoading }: { items: CoinGuideItem[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }
  if (!items) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = iconFor(item.label);
        return (
          <Card key={item.label} className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple/15 text-purple">
              <Icon className="size-5" aria-hidden />
            </div>
            <p className="min-w-0 flex-1 font-medium text-white">{item.label}</p>
            <span className="flex shrink-0 items-center gap-1 font-display font-semibold text-white">
              +{item.coins} <CoinIcon className="size-4" />
            </span>
          </Card>
        );
      })}
    </div>
  );
}
