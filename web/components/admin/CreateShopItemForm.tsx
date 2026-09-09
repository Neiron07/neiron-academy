'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const KINDS = [
  { id: 'physical', label: 'Физический' },
  { id: 'virtual', label: 'Виртуальный' },
  { id: 'privilege', label: 'Привилегия' },
] as const;

export function CreateShopItemForm() {
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('0');
  const [stock, setStock] = useState('');
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('physical');

  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/shop-items', {
        title: title.trim(),
        kind,
        price_coins: Number(price),
        cost_kzt: Number(cost) || 0,
        stock: stock ? Number(stock) : null,
      }),
    onSuccess: () => {
      toast('Товар добавлен', 'success');
      qc.invalidateQueries({ queryKey: ['shop-report'] });
      setTitle('');
      setPrice('');
      setStock('');
    },
    onError: () => toast('Не удалось добавить товар', 'error'),
  });

  return (
    <Card className="mb-6 max-w-md">
      <p className="mb-3 font-medium text-white">Новый товар</p>
      <div className="space-y-3">
        <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
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
        <Button fullWidth disabled={!title.trim() || !price} loading={create.isPending} onClick={() => create.mutate()}>
          Добавить
        </Button>
      </div>
    </Card>
  );
}
