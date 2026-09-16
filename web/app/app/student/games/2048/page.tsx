'use client';

import { TopBar } from '@/components/layout/TopBar';
import { Game2048 } from '@/components/games/Game2048';

export default function Game2048Page() {
  return (
    <>
      <TopBar title="2048" />
      <Game2048 />
    </>
  );
}
