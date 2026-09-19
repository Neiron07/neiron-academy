'use client';

import { use } from 'react';
import { Wallet, CalendarDays, CheckSquare, Sparkles, PartyPopper } from 'lucide-react';
import { MobileShell } from '@/components/layout/MobileShell';
import { ParentChildHeader } from '@/components/parent/ParentChildHeader';
import { OnboardingModal, type OnboardingSlide } from '@/components/onboarding/OnboardingModal';
import { useCurrentUser } from '@/lib/use-current-user';

const SLIDES: OnboardingSlide[] = [
  {
    icon: PartyPopper,
    title: 'Добро пожаловать в Neiron Academy!',
    text: 'Здесь вы можете следить за учёбой ребёнка: оплату, расписание, посещаемость и обратную связь от преподавателя.',
  },
  {
    icon: Wallet,
    title: 'Оплата',
    text: 'В разделе «Оплата» видно текущий период, статус и сумму — с кнопкой быстрой оплаты через WhatsApp.',
  },
  {
    icon: CalendarDays,
    title: 'Расписание',
    text: 'Ближайшее занятие всегда видно на главном экране — с датой, временем и напоминанием, когда до урока остаётся немного времени.',
  },
  {
    icon: CheckSquare,
    title: 'Посещаемость и отзывы',
    text: 'В календаре посещаемости видно, был ли ребёнок на уроке, а в разделе отзывов — что говорит о нём преподаватель.',
  },
  {
    icon: Sparkles,
    title: 'Коины и магазин',
    text: 'Ребёнок получает коины за посещаемость, домашки и активность на уроке — и может обменять их на призы в своём кабинете. Это часть мотивационной системы школы.',
  },
];

export default function ParentChildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: me } = useCurrentUser();
  return (
    <MobileShell withBottomNav={false}>
      <ParentChildHeader childId={id} />
      {children}
      {me && !me.onboarded_at && <OnboardingModal slides={SLIDES} />}
    </MobileShell>
  );
}
