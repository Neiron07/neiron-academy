import { Users, Compass, UsersRound, MessageCircle, type LucideIcon } from 'lucide-react';
import { CountUp } from '@/components/ui/CountUp';

interface Stat {
  icon: LucideIcon;
  value: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { icon: Users, value: 200, suffix: '+', label: 'учеников уже обучили' },
  { icon: Compass, value: 4, suffix: '', label: 'направления: Scratch, Roblox, Python, Нейросети' },
  { icon: UsersRound, value: 6, suffix: '', label: 'человек максимум в группе' },
  { icon: MessageCircle, value: 24, suffix: '/7', label: 'преподаватели на связи' },
];

export function StatsSection() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-purple-mid bg-purple-deep p-5 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-purple/15 text-purple">
              <s.icon className="size-5" aria-hidden />
            </div>
            <p className="font-display text-3xl font-bold text-white sm:text-4xl">
              <CountUp target={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-lavender">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
