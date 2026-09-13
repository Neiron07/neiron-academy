'use client';

import { Users, Compass, UsersRound, MessageCircle, type LucideIcon } from 'lucide-react';
import { CountUp } from '@/components/ui/CountUp';
import { useLang } from '@/lib/i18n/LanguageContext';

const META: { icon: LucideIcon; value: number; suffix: string }[] = [
  { icon: Users, value: 200, suffix: '+' },
  { icon: Compass, value: 5, suffix: '' },
  { icon: UsersRound, value: 6, suffix: '' },
  { icon: MessageCircle, value: 24, suffix: '/7' },
];

export function StatsSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {META.map((m, i) => {
          const label = t.stats.items[i]?.label ?? '';
          return (
            <div
              key={label}
              className="rounded-2xl border border-purple-mid bg-purple-deep p-5 text-center transition-transform duration-300 hover:-translate-y-1 animate-[fade-in-up_0.6s_ease-out_backwards]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-purple/15 text-purple">
                <m.icon className="size-5" aria-hidden />
              </div>
              <p className="font-display text-3xl font-bold text-white sm:text-4xl">
                <CountUp target={m.value} suffix={m.suffix} />
              </p>
              <p className="mt-2 text-sm text-lavender">{label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
