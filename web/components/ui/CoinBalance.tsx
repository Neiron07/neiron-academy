'use client';

import { useEffect, useRef, useState } from 'react';
import { CoinIcon } from './CoinIcon';
import { formatNumber } from '@/lib/format';

/** Число докручивается при изменении — уважает prefers-reduced-motion. */
export function CoinBalance({ value, size = 'lg' }: { value: number; size?: 'lg' | 'md' }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || prev.current === value) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const from = prev.current;
    const to = value;
    const duration = 600;
    const start = performance.now();

    let raf: number;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    prev.current = value;
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="inline-flex items-center gap-2">
      <CoinIcon className={size === 'lg' ? 'size-8' : 'size-6'} />
      <span className={`font-display font-bold text-white ${size === 'lg' ? 'text-4xl' : 'text-2xl'}`}>
        {formatNumber(display)}
      </span>
    </div>
  );
}
