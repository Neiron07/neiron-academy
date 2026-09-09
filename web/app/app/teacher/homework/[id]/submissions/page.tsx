'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { HomeworkSubmissionsResponse } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatRelativeDateTime } from '@/lib/format';

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Сдана, ждёт проверки',
  accepted: 'Принята',
  excellent: 'Отлично',
  rework: 'На доработку',
};

export default function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ['submissions', id],
    queryFn: () => api.get<HomeworkSubmissionsResponse>(`/homework/${id}/submissions`),
  });

  const [openFeedback, setOpenFeedback] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const review = useMutation({
    mutationFn: (p: { submissionId: string; status: 'accepted' | 'excellent' | 'rework'; feedback?: string }) =>
      api.post(`/homework/submissions/${p.submissionId}/review`, { status: p.status, feedback: p.feedback }),
    onSuccess: () => {
      toast('Оценка сохранена', 'success');
      setOpenFeedback(null);
      qc.invalidateQueries({ queryKey: ['submissions', id] });
    },
    onError: () => toast('Не удалось сохранить', 'error'),
  });

  if (isLoading || !data) {
    return (
      <>
        <TopBar title="Проверка домашки" />
        <SkeletonCard />
      </>
    );
  }

  return (
    <>
      <TopBar title={data.homework.title} />
      <div className="space-y-2">
        {data.submissions.map((s) => (
          <Card key={s.student_id}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-white">{s.full_name}</p>
              {s.status && (
                <StatusBadge
                  tone={s.status === 'rework' ? 'negative' : s.status === 'submitted' ? 'neutral' : 'positive'}
                  label={STATUS_LABEL[s.status] ?? s.status}
                />
              )}
            </div>
            {s.content && <p className="mb-2 text-sm text-lavender">{s.content}</p>}
            {s.attachments?.map((a) => (
              <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="mb-1 block text-sm text-white underline">
                {a.name}
              </a>
            ))}
            {!s.submission_id && <p className="text-sm text-muted">Ещё не сдано</p>}
            {s.submitted_at && <p className="mb-2 text-sm text-muted">Сдано {formatRelativeDateTime(s.submitted_at)}</p>}

            {s.submission_id && s.status === 'submitted' && (
              <>
                {openFeedback === s.submission_id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Комментарий (необязательно)"
                      className="w-full resize-none rounded-xl border border-purple-mid bg-transparent px-3 py-2 text-sm text-white placeholder:text-muted outline-none focus:border-purple"
                    />
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button
                        size="sm"
                        loading={review.isPending}
                        onClick={() => review.mutate({ submissionId: s.submission_id!, status: 'accepted', feedback: feedbackText || undefined })}
                      >
                        Принято
                      </Button>
                      <Button
                        size="sm"
                        loading={review.isPending}
                        onClick={() => review.mutate({ submissionId: s.submission_id!, status: 'excellent', feedback: feedbackText || undefined })}
                      >
                        Отлично
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={review.isPending}
                        onClick={() => review.mutate({ submissionId: s.submission_id!, status: 'rework', feedback: feedbackText || undefined })}
                      >
                        Доработать
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setOpenFeedback(s.submission_id);
                      setFeedbackText('');
                    }}
                  >
                    Проверить
                  </Button>
                )}
              </>
            )}
            {s.feedback && <p className="mt-2 text-sm text-lavender">Комментарий: {s.feedback}</p>}
          </Card>
        ))}
      </div>
    </>
  );
}
