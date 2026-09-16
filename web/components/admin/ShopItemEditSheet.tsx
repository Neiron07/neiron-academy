'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { AdminShopItem } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const KINDS = [
  { id: 'physical', label: 'Физический' },
  { id: 'virtual', label: 'Виртуальный' },
  { id: 'privilege', label: 'Привилегия' },
] as const;

export function ShopItemEditSheet({ item, onClose }: { item: AdminShopItem | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('0');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('physical');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setPrice(String(item.price_coins));
    setCost(String(item.cost_kzt));
    setStock(item.stock === null ? '' : String(item.stock));
    setImageUrl(item.image_url ?? '');
    setKind(item.kind);
    setIsActive(item.is_active);
  }, [item]);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/admin/shop-items/${item!.id}`, {
        title: title.trim(),
        kind,
        price_coins: Number(price),
        cost_kzt: Number(cost) || 0,
        stock: stock ? Number(stock) : null,
        image_url: imageUrl.trim() || null,
        is_active: isActive,
      }),
    onSuccess: () => {
      toast('Товар обновлён', 'success');
      qc.invalidateQueries({ queryKey: ['admin-shop-items'] });
      qc.invalidateQueries({ queryKey: ['shop-report'] });
      onClose();
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось сохранить товар', 'error'),
  });

  return (
    <Sheet open={!!item} onClose={onClose} title="Редактировать товар">
      <div className="space-y-3">
        <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="flex gap-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`flex-1 rounded-lg border py-2 text-sm ${kind === k.id ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'}`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Input label="Цена, коины" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="flex-1" />
          <Input label="Себест., ₸" type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="flex-1" />
        </div>
        <Input
          label="Остаток (пусто = без лимита)"
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
        <Input
          label="Ссылка на картинку (необязательно)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
        {imageUrl.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl.trim()} alt="" className="h-24 w-24 rounded-xl border border-purple-mid object-cover" />
        )}
        <label className="flex items-center gap-2 text-sm text-lavender">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 rounded border-purple-mid accent-purple"
          />
          Активен (виден ученикам в магазине)
        </label>
        <Button
          fullWidth
          size="lg"
          disabled={!title.trim() || !price}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          Сохранить
        </Button>
      </div>
    </Sheet>
  );
}
