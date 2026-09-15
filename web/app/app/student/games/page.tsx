'use client';

import Link from 'next/link';
import { ChevronRight, Bug } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';

export default function StudentGamesPage() {
  return (
    <>
      <TopBar title="Игры" />
      <div className="space-y-2">
        <Link href="/app/student/games/dino">
          <Card className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-purple/15 text-purple">
                <Bug className="size-5" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-white">Убеги от вирусов</p>
                <p className="text-sm text-lavender">AIdos прыгает через вирусы — как в игре про динозаврика</p>
              </div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
          </Card>
        </Link>
      </div>
    </>
  );
}
