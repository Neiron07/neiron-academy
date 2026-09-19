'use client';

import { User, ShoppingBag, Trophy, ClipboardList, Gamepad2, Sparkles, Gift, PartyPopper } from 'lucide-react';
import { MobileShell } from '@/components/layout/MobileShell';
import { BottomNav } from '@/components/layout/BottomNav';
import { OnboardingModal, type OnboardingSlide } from '@/components/onboarding/OnboardingModal';
import { useCurrentUser } from '@/lib/use-current-user';

const items = [
  { href: '/app/student', label: 'Профиль', icon: User },
  { href: '/app/student/shop', label: 'Магазин', icon: ShoppingBag },
  { href: '/app/student/rating', label: 'Рейтинг', icon: Trophy },
  { href: '/app/student/homework', label: 'Домашки', icon: ClipboardList },
  { href: '/app/student/games', label: 'Игры', icon: Gamepad2 },
];

const SLIDES: OnboardingSlide[] = [
  {
    icon: PartyPopper,
    title: 'Добро пожаловать в Neiron Academy!',
    text: 'Это твой личный кабинет. Здесь растёт твой помощник Нейрон, копятся коины и можно следить за успехами.',
  },
  {
    icon: Sparkles,
    title: 'Коины',
    text: 'За посещение уроков, домашки в срок и хорошую работу на занятии ты получаешь коины. Посмотреть, за что именно — на странице «Профиль».',
  },
  {
    icon: Gift,
    title: 'Магазин',
    text: 'В разделе «Магазин» коины можно обменять на призы и привилегии — физические и виртуальные.',
  },
  {
    icon: Trophy,
    title: 'Рейтинг и игры',
    text: 'В «Рейтинге» видно топ-10 лучших учеников школы. А в «Играх» можно отдохнуть между уроками — и тоже побороться за место в таблице лидеров.',
  },
  {
    icon: ClipboardList,
    title: 'Домашки',
    text: 'Не забывай сдавать домашки вовремя — за это дают больше коинов, чем если сдать с опозданием.',
  },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: me } = useCurrentUser();
  return (
    <MobileShell>
      {children}
      <BottomNav items={items} />
      {me && !me.onboarded_at && <OnboardingModal slides={SLIDES} />}
    </MobileShell>
  );
}
