'use client';

import { TopBar } from '@/components/layout/TopBar';
import { FlappyBird } from '@/components/games/FlappyBird';

export default function FlappyGamePage() {
  return (
    <>
      <TopBar title="Нейрон-полёт" />
      <FlappyBird />
    </>
  );
}
