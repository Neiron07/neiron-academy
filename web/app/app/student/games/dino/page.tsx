'use client';

import { TopBar } from '@/components/layout/TopBar';
import { DinoRunner } from '@/components/games/DinoRunner';

export default function DinoGamePage() {
  return (
    <>
      <TopBar title="Убеги от вирусов" />
      <DinoRunner />
    </>
  );
}
