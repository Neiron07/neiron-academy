'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Backpack } from 'lucide-react';
import { api } from '@/lib/api';
import type { EquipSlot, InventoryItem, StudentProfile } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Glow } from '@/components/ui/Glow';
import { MascotSvg } from '@/components/mascot/MascotSvg';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const SLOTS: { id: EquipSlot; label: string }[] = [
  { id: 'frame', label: 'Рамка' },
  { id: 'skin', label: 'Скин' },
  { id: 'title', label: 'Титул' },
  { id: 'theme', label: 'Тема' },
];

export default function InventoryPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [slotFor, setSlotFor] = useState<Record<string, EquipSlot>>({});

  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => api.get<StudentProfile>('/me/profile'),
  });
  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get<InventoryItem[]>('/me/inventory'),
  });

  const equip = useMutation({
    mutationFn: (p: { slot: EquipSlot; item_id: string | null }) => api.post('/me/equip', p),
    onSuccess: () => {
      toast('Готово, видно сразу', 'success');
      qc.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: () => toast('Не удалось надеть', 'error'),
  });

  return (
    <>
      <TopBar title="Инвентарь" />

      {profile && (
        <div className="relative mb-6 flex justify-center">
          <Glow className="left-1/2 top-2 size-48 -translate-x-1/2" />
          <MascotSvg stageCode={profile.mascot.stageCode} frame={profile.equipped.frame} className="relative z-10 size-40" />
        </div>
      )}

      {isLoading && <SkeletonCard />}
      {items?.length === 0 && <EmptyState icon={Backpack} title="Инвентарь пуст" hint="Купи что-нибудь в магазине" />}

      <div className="space-y-2">
        {items?.map((item) => (
          <Card key={item.id} className="flex items-center gap-3">
            <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-purple-mid/30">
              {item.image_url && <Image src={item.image_url} alt={item.title} width={56} height={56} className="size-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{item.title}</p>
              <div className="mt-1 flex gap-1.5">
                <select
                  value={slotFor[item.id] ?? 'frame'}
                  onChange={(e) => setSlotFor((s) => ({ ...s, [item.id]: e.target.value as EquipSlot }))}
                  className="h-8 rounded-lg border border-purple-mid bg-transparent px-2 text-xs text-lavender outline-none"
                >
                  {SLOTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={equip.isPending}
                  onClick={() => equip.mutate({ slot: slotFor[item.id] ?? 'frame', item_id: item.id })}
                >
                  Надеть
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
