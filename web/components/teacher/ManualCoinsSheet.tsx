'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { MANUAL_REASONS } from '@/lib/constants';

export function ManualCoinsSheet({
  open,
  onClose,
  studentName,
  presets,
  remaining,
  loading,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  studentName: string;
  presets: readonly number[];
  remaining: number;
  loading: boolean;
  onSubmit: (coins: number, reason: string) => void;
}) {
  const [coins, setCoins] = useState<number>(presets[0] ?? 5);
  const [reason, setReason] = useState<string>(MANUAL_REASONS[0]);

  return (
    <Sheet open={open} onClose={onClose} title={`Коины: ${studentName}`}>
      <p className="mb-3 text-sm text-muted">Осталось {remaining} из лимита на этот урок</p>

      <div className="mb-4 flex gap-2">
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

      <p className="mb-2 text-sm text-lavender">Причина</p>
      <div className="mb-5 space-y-2">
        {MANUAL_REASONS.map((r) => (
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
