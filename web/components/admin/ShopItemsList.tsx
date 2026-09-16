'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Package } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminShopItem } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { ShopItemEditSheet } from '@/components/admin/ShopItemEditSheet';

const KIND_LABEL: Record<string, string> = {
  physical: 'Физический',
  virtual: 'Виртуальный',
  privilege: 'Привилегия',
};

export function ShopItemsList() {
  const [editItem, setEditItem] = useState<AdminShopItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shop-items'],
    queryFn: () => api.get<AdminShopItem[]>('/admin/shop-items'),
  });

  return (
    <Card className="mb-6">
      <p className="mb-3 font-medium text-white">Товары</p>
      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data?.length === 0 && <EmptyState icon={Package} title="Товаров пока нет" />}
      {data && data.length > 0 && (
        <div className="space-y-2">
          {data.map((item) => (
            <button
              key={item.id}
              onClick={() => setEditItem(item)}
              className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left ${item.is_active ? 'border-purple-mid' : 'border-purple-mid opacity-50'}`}
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-purple/15 text-purple">
                  <Package className="size-5" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{item.title}</p>
                <p className="truncate text-xs text-muted">
                  {KIND_LABEL[item.kind] ?? item.kind}
                  {item.stock !== null && ` · остаток ${item.stock}`}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 font-display text-sm font-semibold text-white">
                <CoinIcon className="size-4" />
                {item.price_coins}
              </span>
              {!item.is_active && <StatusBadge tone="neutral" label="Скрыт" />}
              <Pencil className="size-4 shrink-0 text-muted" aria-hidden />
            </button>
          ))}
        </div>
      )}
      <ShopItemEditSheet item={editItem} onClose={() => setEditItem(null)} />
    </Card>
  );
}
