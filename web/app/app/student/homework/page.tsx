'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { StudentHomework } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatRelativeDateTime } from '@/lib/format';

const STATUS_INFO: Record<string, { label: string; tone: 'positive' | 'neutral' | 'negative' }> = {
  submitted: { label: 'На проверке', tone: 'neutral' },
  accepted: { label: 'Принята', tone: 'positive' },
  excellent: { label: 'Отлично', tone: 'positive' },
  rework: { label: 'Нужна доработка', tone: 'negative' },
};

export default function StudentHomeworkPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ['student-homework'],
    queryFn: () => api.get<StudentHomework[]>('/homework/my'),
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');

  const submit = useMutation({
    mutationFn: (id: string) =>
      api.post(`/homework/${id}/submit`, {
        content: content.trim() || undefined,
        attachments: link.trim() ? [{ name: 'Ссылка на проект', url: link.trim() }] : [],
      }),
    onSuccess: () => {
      toast('Домашка сдана', 'success');
      setOpenId(null);
      setContent('');
      setLink('');
      qc.invalidateQueries({ queryKey: ['student-homework'] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось сдать', 'error'),
  });

  return (
    <>
      <TopBar title="Домашки" />
      {isLoading && <SkeletonCard />}
      {data?.length === 0 && <EmptyState icon={ClipboardList} title="Заданий пока нет" hint="Появятся после следующего урока" />}

      <div className="space-y-2">
        {data?.map((h) => {
          const canSubmit = !h.status || h.status === 'rework';
          const info = h.status ? STATUS_INFO[h.status] : null;
          return (
            <Card key={h.id}>
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="font-medium text-white">{h.title}</p>
                {info && <StatusBadge tone={info.tone} label={info.label} />}
              </div>
              {h.topic && <p className="mb-1 text-sm text-lavender">{h.topic}</p>}
              {h.description && <p className="mb-2 text-sm text-lavender">{h.description}</p>}
              {h.deadline_at && <p className="mb-2 text-sm text-muted">Дедлайн: {formatRelativeDateTime(h.deadline_at)}</p>}
              {h.feedback && <p className="mb-2 text-sm text-lavender">Комментарий: {h.feedback}</p>}

              {canSubmit &&
                (openId === h.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Расскажи, что сделал"
                      className="w-full resize-none rounded-xl border border-purple-mid bg-transparent px-3 py-2 text-sm text-white placeholder:text-muted outline-none focus:border-purple"
                    />
                    <input
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="Ссылка на проект (необязательно)"
                      className="h-10 w-full rounded-xl border border-purple-mid bg-transparent px-3 text-sm text-white placeholder:text-muted outline-none focus:border-purple"
                    />
                    <Button
                      size="sm"
                      fullWidth
                      loading={submit.isPending}
                      disabled={!content.trim() && !link.trim()}
                      onClick={() => submit.mutate(h.id)}
                    >
                      Сдать
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setOpenId(h.id)}>
                    {h.status === 'rework' ? 'Пересдать' : 'Сдать домашку'}
                  </Button>
                ))}
            </Card>
          );
        })}
      </div>
    </>
  );
}
