'use client';

import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

/** Четыре крупных бокса, цифровая клавиатура, ребёнок видит, что вводит — не type="password". */
export function PinInput({ value, onChange, length = 4, autoFocus }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('');

  function setDigit(i: number, d: string) {
    const clean = d.replace(/\D/g, '').slice(-1);
    const next = digits.slice();
    next[i] = clean;
    const joined = next.join('').slice(0, length);
    onChange(joined);
    if (clean && i < length - 1) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  return (
    <div className="flex justify-center gap-3" role="group" aria-label="Код PIN">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digits[i] ?? ''}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          aria-label={`Цифра ${i + 1}`}
          className="size-14 rounded-2xl border border-purple-mid bg-transparent text-center font-display text-2xl font-semibold text-white outline-none focus:border-purple"
        />
      ))}
    </div>
  );
}
