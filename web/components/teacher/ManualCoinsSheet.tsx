'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { CoinIcon } from '@/components/ui/CoinIcon';

/** Подсказка «сколько за что», чтобы препод не начислял на глаз и не перебарщивал. */
const PRESET_HINT: Record<number, string> = {
  5: 'обычная активность',
  10: 'стандартный случай',
  20: 'особый вклад, редко',
};

export function ManualCoinsSheet({
  open,
  onClose,
  studentName,
  presets,
  reasons,
  remaining,
  loading,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  studentName: string;
  presets: readonly number[];
  reasons: readonly string[];
  remaining: number;
  loading: boolean;
  onSubmit: (coins: number, reason: string) => void;
}) {
  const [coins, setCoins] = useState<number>(presets[0] ?? 5);
  const [reason, setReason] = useState<string>(reasons[0] ?? '');

  return (
    <Sheet open={open} onClose={onClose} title={`Коины: ${studentName}`}>
      <p className="mb-3 text-sm text-muted">Осталось {remaining} из лимита на этот урок</p>

      <div className="mb-1.5 flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setCoins(p)}
            disabled={p > remaining}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 font-display font-semibold transition-colors disabled:opacity-30 ${
              coins === p ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'
            }`}
          >
            <CoinIcon className="size-4" />
            {p}
          </button>
        ))}
      </div>
      <div className="mb-2 flex gap-2 text-center text-xs text-muted">
        {presets.map((p) => (
          <span key={p} className="flex-1">
            {PRESET_HINT[p] ?? ''}
          </span>
        ))}
      </div>
      <p className="mb-4 flex items-start gap-1.5 rounded-xl bg-purple/10 px-3 py-2 text-xs text-lavender">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Начисляй по делу и без перебора: 5–10 коинов — обычный повод, 20 — редкий особый случай.{' '}
        <Link href="/app/teacher/coin-guide" className="underline hover:text-white">
          Полный гайд
        </Link>
      </p>

      <p className="mb-2 text-sm text-lavender">Причина</p>
      <div className="mb-5 space-y-2">
        {reasons.map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              reason === r ? 'border-purple bg-purple/15 text-white' : 'border-purple-mid text-lavender'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <Button
        fullWidth
        size="lg"
        loading={loading}
        disabled={coins > remaining}
        onClick={() => onSubmit(coins, reason)}
      >
        Начислить {coins} коинов
      </Button>
    </Sheet>
  );
}
