'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import type { ShopResponse } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { SHOP_ITEM_KINDS } from '@/lib/constants';

const KIND_LABEL = Object.fromEntries(SHOP_ITEM_KINDS.map((k) => [k.id, k.label]));

/** Витрина магазина для родителя — только посмотреть, без покупки: своя кнопка есть у ребёнка в его кабинете. */
export default function ParentShopPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['shop'],
    queryFn: () => api.get<ShopResponse>('/shop'),
  });

  if (isLoading) return <SkeletonCard />;
  if (!data || data.items.length === 0) return <EmptyState icon={ShoppingBag} title="В магазине пока пусто" />;

  return (
    <div>
      <p className="mb-4 text-sm text-lavender">
        Вот что ребёнок может купить за коины, заработанные на занятиях. Покупает он сам, в своём кабинете.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {data.items.map((item) => (
          <Card key={item.id} className="flex flex-col p-3">
            <div className="mb-2 aspect-square overflow-hidden rounded-xl bg-purple-deep">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title}
                  width={200}
                  height={200}
                  className="size-full object-cover opacity-90"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted">
                  <ShoppingBag className="size-8" aria-hidden />
                </div>
              )}
            </div>
            <p className="mb-1 line-clamp-2 text-sm font-medium text-white">{item.title}</p>
            <p className="mb-1 flex items-center gap-1 font-display text-sm font-semibold text-white">
              <CoinIcon className="size-3.5" /> {item.price_coins}
            </p>
            <span className="mt-auto text-xs text-muted">{KIND_LABEL[item.kind] ?? item.kind}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
