'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ShopReport } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { CreateShopItemForm } from '@/components/admin/CreateShopItemForm';
import { EmissionChart, CostChart } from '@/components/admin/ShopReportCharts';

export default function AdminShopPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['shop-report'],
    queryFn: () => api.get<ShopReport>('/admin/shop-report'),
  });

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold text-white">Магазин</h1>
      <CreateShopItemForm />

      {isLoading && <SkeletonCard />}
      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <p className="mb-3 font-medium text-white">Начислено vs списано коинов</p>
            <EmissionChart data={data.emitted} />
          </Card>
          <Card>
            <p className="mb-3 font-medium text-white">Себестоимость призов по месяцам</p>
            <p className="mb-2 text-xs text-muted">Держите ≤ 5% выручки</p>
            <CostChart data={data.issued} />
          </Card>
        </div>
      )}
    </div>
  );
}
