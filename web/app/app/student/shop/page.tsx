'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Check } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { BuyResponse, ShopResponse } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ERROR_HINTS } from '@/lib/constants';

export default function ShopPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [affordableOnly, setAffordableOnly] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['shop'],
    queryFn: () => api.get<ShopResponse>('/shop'),
  });

  const buy = useMutation({
    mutationFn: (itemId: string) => api.post<BuyResponse>(`/shop/${itemId}/buy`),
    onSuccess: (res) => {
      toast(res.message, 'success');
      qc.invalidateQueries({ queryKey: ['shop'] });
      qc.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: (e) => toast(e instanceof ApiError ? (ERROR_HINTS[e.code] ?? e.message) : 'Не удалось купить', 'error'),
  });

  const items = (data?.items ?? []).filter((i) => !affordableOnly || i.affordable || i.owned);

  return (
    <>
      <TopBar
        title="Магазин"
        right={
          data?.balance !== null && data?.balance !== undefined ? (
            <span className="flex items-center gap-1 text-sm text-white">
              <CoinIcon className="size-4" /> {data.balance}
            </span>
          ) : undefined
        }
      />

      <label className="mb-4 flex items-center gap-2 text-sm text-lavender">
        <input
          type="checkbox"
          checked={affordableOnly}
          onChange={(e) => setAffordableOnly(e.target.checked)}
          className="size-4 rounded border-purple-mid accent-purple"
        />
        Что мне по карману
      </label>

      {isLoading && <SkeletonCard />}
      {!isLoading && items.length === 0 && (
        <EmptyState icon={ShoppingBag} title="Пока нечего показать" hint="Скопи ещё немного коинов или посмотри весь каталог" />
      )}

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-col p-3">
            <div className="mb-2 aspect-square overflow-hidden rounded-xl bg-purple-deep">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title}
                  width={200}
                  height={200}
                  className="size-full object-cover opacity-90 transition-opacity hover:opacity-100"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted">
                  <ShoppingBag className="size-8" aria-hidden />
                </div>
              )}
            </div>
            <p className="mb-1 line-clamp-2 text-sm font-medium text-white">{item.title}</p>
            <p className="mb-2 flex items-center gap-1 font-display text-sm font-semibold text-white">
              <CoinIcon className="size-3.5" /> {item.price_coins}
            </p>
            {item.owned ? (
              <span className="mt-auto flex items-center justify-center gap-1 rounded-lg border border-purple-mid py-2 text-xs text-lavender">
                <Check className="size-3.5" aria-hidden /> Уже есть
              </span>
            ) : (
              <Button
                size="sm"
                fullWidth
                className="mt-auto"
                disabled={item.affordable === false}
                loading={buy.isPending}
                onClick={() => buy.mutate(item.id)}
              >
                Купить
              </Button>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
