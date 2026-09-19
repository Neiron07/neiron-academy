'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CoinGuideItem } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { CoinGuideList } from '@/components/coins/CoinGuideList';

export default function CoinGuidePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['coin-guide'],
    queryFn: () => api.get<CoinGuideItem[]>('/me/coin-rules'),
  });

  return (
    <>
      <TopBar title="За что дают коины?" />
      <p className="-mt-3 mb-4 text-sm text-lavender">
        Учись, старайся и не пропускай уроки — коины копятся сами. А за проекты, конкурсы и активность препод может начислить их вручную.
      </p>
      <CoinGuideList items={data} isLoading={isLoading} />
    </>
  );
}
