'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CoinGuideItem } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { CoinGuideList } from '@/components/coins/CoinGuideList';

export default function TeacherCoinGuidePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['coin-guide'],
    queryFn: () => api.get<CoinGuideItem[]>('/teacher/coin-guide'),
  });

  return (
    <>
      <TopBar title="Сколько начислять" />
      <p className="-mt-3 mb-4 text-sm text-lavender">
        Единые суммы по всей школе — чтобы за одно и то же ученики получали одинаково у разных преподавателей.
        Крупные разовые начисления (от 60 коинов) — через админа, ручные коины на уроке ограничены {' '}
        <span className="text-white">30 коинами за урок на группу</span>.
      </p>
      <CoinGuideList items={data} isLoading={isLoading} />
    </>
  );
}
