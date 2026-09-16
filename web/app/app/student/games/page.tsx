'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { DinoCover, FlappyCover } from '@/components/games/GameCovers';

const GAMES = [
  {
    href: '/app/student/games/dino',
    title: 'Убеги от вирусов',
    description: 'Нейрон прыгает через вирусы — как в игре про динозаврика',
    cover: DinoCover,
  },
  {
    href: '/app/student/games/flappy',
    title: 'Нейрон-полёт',
    description: 'Пролети между труб как можно дальше — классика с Нейроном',
    cover: FlappyCover,
  },
];

export default function StudentGamesPage() {
  return (
    <>
      <TopBar title="Игры" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GAMES.map((g) => {
          const Cover = g.cover;
          return (
            <Link key={g.href} href={g.href}>
              <Card className="overflow-hidden !p-0">
                <div className="aspect-[16/10] w-full border-b border-purple-mid">
                  <Cover />
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="font-medium text-white">{g.title}</p>
                    <p className="text-sm text-lavender">{g.description}</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
