'use client';

import { useEffect, useState } from 'react';

/** Полный текст остаётся в aria-label для скринридеров — анимация только визуальная. */
export function Typewriter({ text, speed = 35, className = '' }: { text: string; speed?: number; className?: string }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const done = shown.length >= text.length;

  return (
    <span className={className} aria-hidden="true">
      {shown}
      <span className={`ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-[0.1em] bg-current align-middle ${done ? 'animate-pulse' : ''}`} />
    </span>
  );
}
