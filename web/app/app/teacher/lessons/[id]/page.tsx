'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins, Check, MessageSquareHeart } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { AttendanceStatus, LessonDetail, LessonFeedbackItem } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ManualCoinsSheet } from '@/components/teacher/ManualCoinsSheet';
import { LessonFeedbackSheet, type FeedbackDraftItem } from '@/components/teacher/LessonFeedbackSheet';
import { ATTENDANCE_LABEL, ERROR_HINTS } from '@/lib/constants';
import { formatRelativeDateTime } from '@/lib/format';

const STATUS_ORDER: AttendanceStatus[] = ['present', 'late', 'excused', 'absent'];

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const draftKey = `lesson-draft:${id}`;

  const { data, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => api.get<LessonDetail>(`/lessons/${id}`),
  });

  const { data: existingFeedback } = useQuery({
    queryKey: ['lesson-feedback', id],
    queryFn: () => api.get<LessonFeedbackItem[]>(`/lessons/${id}/feedback`),
  });

  const [marks, setMarks] = useState<Record<string, AttendanceStatus | null>>({});
  const [topicId, setTopicId] = useState('');
  const [manualFor, setManualFor] = useState<string | null>(null);
  const [manualUsed, setManualUsed] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAutoFlow, setFeedbackAutoFlow] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!data) return;
    setManualUsed(data.manual.used);
    let draft: Record<string, AttendanceStatus | null> = {};
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) draft = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    const initial: Record<string, AttendanceStatus | null> = {};
    for (const s of data.roster) {
      initial[s.student_id] = draft[s.student_id] ?? s.attendance_status ?? null;
    }
    setMarks(initial);
  }, [data, draftKey]);

  useEffect(() => {
    if (Object.keys(marks).length === 0) return;
    sessionStorage.setItem(draftKey, JSON.stringify(marks));
  }, [marks, draftKey]);

  const manualMutation = useMutation({
    mutationFn: (p: { student_id: string; coins: number; reason: string }) =>
      api.post(`/lessons/${id}/coins`, p),
    onSuccess: (_res, vars) => {
      setManualUsed((u) => u + vars.coins);
      setManualFor(null);
      toast(`Начислено ${vars.coins} коинов`, 'success');
      qc.invalidateQueries({ queryKey: ['lesson', id] });
    },
    onError: (e) => toast(hintFor(e), 'error'),
  });

  const feedbackMutation = useMutation({
    mutationFn: (items: FeedbackDraftItem[]) => api.post(`/lessons/${id}/feedback`, { items }),
    onSuccess: () => {
      toast('Обратная связь сохранена', 'success');
      qc.invalidateQueries({ queryKey: ['lesson-feedback', id] });
      closeFeedback();
    },
    onError: (e) => toast(hintFor(e), 'error'),
  });

  function closeFeedback() {
    setShowFeedback(false);
    if (feedbackAutoFlow) router.push('/app/teacher');
  }

  const allMarked = data ? data.roster.every((s) => marks[s.student_id]) : false;

  async function complete() {
    if (!data || !allMarked) return;
    setCompleting(true);
    try {
      const items = data.roster.map((s) => ({ student_id: s.student_id, status: marks[s.student_id] as AttendanceStatus }));
      await api.post(`/lessons/${id}/attendance`, { items });
      await api.post(`/lessons/${id}/complete`, topicId ? { topic_id: topicId } : {});
      sessionStorage.removeItem(draftKey);
      qc.invalidateQueries({ queryKey: ['lesson', id] });
      toast('Урок завершён', 'success');
      setFeedbackAutoFlow(true);
      setShowFeedback(true);
    } catch (e) {
      toast(hintFor(e), 'error');
    } finally {
      setCompleting(false);
    }
  }

  const manualStudent = useMemo(
    () => data?.roster.find((s) => s.student_id === manualFor) ?? null,
    [data, manualFor],
  );

  if (isLoading || !data) {
    return (
      <>
        <TopBar title="Урок" />
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </>
    );
  }

  const remaining = data.manual.limit - manualUsed;
  const hasFeedback = (existingFeedback?.length ?? 0) > 0;

  return (
    <>
      <TopBar title={data.lesson.group_name} />
      <p className="-mt-3 mb-4 text-sm text-lavender">{formatRelativeDateTime(data.lesson.scheduled_at)}</p>

      {data.lesson.status === 'completed' && (
        <Card className="mb-4 flex items-center justify-between gap-2 text-sm text-lavender">
          <span>Урок уже проведён. Можно изменить отметки при необходимости.</span>
        </Card>
      )}

      {data.lesson.status === 'completed' && (
        <Button
          variant="secondary"
          fullWidth
          className="mb-4"
          onClick={() => {
            setFeedbackAutoFlow(false);
            setShowFeedback(true);
          }}
        >
          <MessageSquareHeart className="size-4" aria-hidden />
          {hasFeedback ? 'Изменить обратную связь' : 'Оставить обратную связь'}
        </Button>
      )}

      <div className="mb-3 flex items-center justify-between rounded-xl border border-purple-mid px-4 py-2.5 text-sm">
        <span className="flex items-center gap-1.5 text-lavender">
          <Coins className="size-4" aria-hidden /> Ручные коины
        </span>
        <span className={remaining <= 0 ? 'text-muted' : 'text-white'}>
          Осталось {Math.max(0, remaining)} из {data.manual.limit}
        </span>
      </div>

      <div className="space-y-2">
        {data.roster.map((s) => (
          <Card key={s.student_id} className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-white">{s.full_name}</p>
              <button
                onClick={() => setManualFor(s.student_id)}
                disabled={remaining <= 0}
                className="flex items-center gap-1 rounded-lg border border-purple-mid px-2.5 py-1.5 text-xs text-lavender disabled:opacity-30"
              >
                <Coins className="size-3.5" aria-hidden />+коины
                {s.manual_coins_given > 0 && <span className="text-white">({s.manual_coins_given})</span>}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {STATUS_ORDER.map((st) => {
                const active = marks[s.student_id] === st;
                return (
                  <button
                    key={st}
                    onClick={() => setMarks((m) => ({ ...m, [s.student_id]: st }))}
                    className={`flex h-12 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                      active ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'
                    }`}
                  >
                    {ATTENDANCE_LABEL[st]}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {data.topics.length > 0 && (
        <div className="mt-5">
          <p className="mb-1.5 text-sm text-lavender">Пройденная тема</p>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="h-11 w-full rounded-xl border border-purple-mid bg-purple-deep px-3 text-white outline-none focus:border-purple"
          >
            <option value="">Не выбрана</option>
            {data.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.module_title} · {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={data.lesson.status === 'completed' ? 'mt-5' : 'sticky bottom-24 mt-5'}>
        {!allMarked && data.lesson.status !== 'completed' && (
          <p className="mb-2 text-center text-sm text-muted">Отметьте всех, чтобы завершить урок</p>
        )}
        <Button
          fullWidth
          size={data.lesson.status === 'completed' ? 'md' : 'lg'}
          variant={data.lesson.status === 'completed' ? 'secondary' : 'primary'}
          disabled={!allMarked}
          loading={completing}
          onClick={complete}
        >
          <Check className="size-5" aria-hidden />
          {data.lesson.status === 'completed' ? 'Сохранить изменения посещаемости' : 'Завершить урок'}
        </Button>
      </div>

      {manualStudent && (
        <ManualCoinsSheet
          open
          onClose={() => setManualFor(null)}
          studentName={manualStudent.full_name}
          presets={data.manual.presets}
          remaining={remaining}
          loading={manualMutation.isPending}
          onSubmit={(coins, reason) => manualMutation.mutate({ student_id: manualStudent.student_id, coins, reason })}
        />
      )}

      <LessonFeedbackSheet
        open={showFeedback}
        onClose={closeFeedback}
        roster={data.roster}
        existing={existingFeedback}
        loading={feedbackMutation.isPending}
        onSubmit={(items) => feedbackMutation.mutate(items)}
        onSkip={closeFeedback}
      />
    </>
  );
}

function hintFor(e: unknown): string {
  if (e instanceof ApiError) return ERROR_HINTS[e.code] ?? e.message;
  return 'Что-то пошло не так';
}
