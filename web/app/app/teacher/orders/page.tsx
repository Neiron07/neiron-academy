'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { api } from '@/lib/api';
import type { PendingOrder } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

export default function TeacherOrdersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-orders'],
    queryFn: () => api.get<PendingOrder[]>('/teacher/orders/pending'),
  });

  const issue = useMutation({
    mutationFn: (id: string) => api.post(`/teacher/orders/${id}/issue`),
    onSuccess: () => {
      toast('Заказ выдан', 'success');
      qc.invalidateQueries({ queryKey: ['teacher-orders'] });
    },
    onError: () => toast('Не удалось выдать заказ', 'error'),
  });

  return (
    <>
      <TopBar title="Выдать сегодня" />
      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {data?.length === 0 && <EmptyState icon={Package} title="Заказов к выдаче нет" hint="Появятся, когда ученики что-то купят в магазине" />}
      <div className="space-y-2">
        {data?.map((o) => (
          <Card key={o.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-white">{o.item_title}</p>
              <p className="text-sm text-lavender">
                {o.student_name}
                {o.group_name && ` · ${o.group_name}`}
              </p>
            </div>
            <Button size="sm" loading={issue.isPending} onClick={() => issue.mutate(o.id)}>
              Выдать
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}
