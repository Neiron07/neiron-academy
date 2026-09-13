'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Glow } from '@/components/ui/Glow';
import { Button } from '@/components/ui/Button';
import { useLang } from '@/lib/i18n/LanguageContext';

/**
 * Видео — /public/videos/hero.mp4 (ребёнок печатает/пишет что-то за ноутбуком).
 * Пока файла нет, тихо скрываем <video> и остаётся фон с Glow — ничего не ломается.
 */
export function Hero() {
  const { t } = useLang();
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center overflow-hidden px-5 py-10 text-center">
      {!videoFailed && (
        <>
          <video
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 size-full object-cover opacity-40"
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg" />
        </>
      )}
      <Glow className="left-1/2 top-1/3 size-[420px] -translate-x-1/2 -translate-y-1/2" />
      <div className="relative z-10 max-w-lg animate-[fade-in-up_0.7s_ease-out]">
        <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">{t.hero.headline}</h1>
        <p className="mt-4 text-lg text-lavender">{t.hero.subtitle}</p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Link href="#заявка">
            <Button size="lg" className="transition-transform hover:scale-105 active:scale-95">
              {t.hero.cta}
            </Button>
          </Link>
          <p className="text-sm text-muted">{t.hero.ctaHint}</p>
        </div>
      </div>
    </section>
  );
}
