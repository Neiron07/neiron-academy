'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, ClipboardList, BookOpen, Plus, Trash2, ExternalLink, Users, CalendarDays } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { GroupDetail, HomeworkListItem, Material } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatRelativeDateTime } from '@/lib/format';

type Tab = 'roster' | 'lessons' | 'homework' | 'materials';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'roster', label: 'Состав', icon: Users },
  { id: 'lessons', label: 'Уроки', icon: CalendarDays },
  { id: 'homework', label: 'Домашки', icon: ClipboardList },
  { id: 'materials', label: 'Материалы', icon: BookOpen },
];

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('roster');

  const { data, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.get<GroupDetail>(`/teacher/groups/${id}`),
  });

  const [pinFor, setPinFor] = useState<{ id: string; name: string } | null>(null);
  const [newPin, setNewPin] = useState<string | null>(null);

  const resetPin = useMutation({
    mutationFn: (studentId: string) => api.post<{ pin: string }>(`/teacher/students/${studentId}/reset-pin`),
    onSuccess: (res) => setNewPin(res.pin),
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось сбросить PIN', 'error'),
  });

  if (isLoading || !data) {
    return (
      <>
        <TopBar title="Группа" />
        <SkeletonCard />
      </>
    );
  }

  return (
    <>
      <TopBar title={data.group.name} />
      <p className="-mt-3 mb-4 text-sm text-lavender">{data.group.course_name}</p>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-purple-mid p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-purple text-white' : 'text-lavender hover:text-white'
            }`}
          >
            <t.icon className="size-3.5" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'roster' && (
        <div className="space-y-2">
          {data.students.length === 0 && <EmptyState icon={Users} title="В группе пока никого нет" />}
          {data.students.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{s.full_name}</p>
                  <p className="text-sm text-lavender">
                    {s.coins_balance} коинов · {s.attendance_pct ?? '—'}% посещаемость
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPinFor({ id: s.id, name: s.full_name });
                    setNewPin(null);
                  }}
                  className="flex size-9 items-center justify-center rounded-full text-lavender hover:bg-white/5 hover:text-white"
                  aria-label={`Сбросить PIN у ${s.full_name}`}
                >
                  <KeyRound className="size-4" aria-hidden />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'lessons' && (
        <div className="space-y-5">
          {data.upcomingLessons.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-lavender">Ближайшие</p>
              <div className="space-y-2">
                {data.upcomingLessons.map((l) => (
                  <Link key={l.id} href={`/app/teacher/lessons/${l.id}`}>
                    <Card className="flex items-center justify-between">
                      <span className="text-white">{formatRelativeDateTime(l.scheduled_at)}</span>
                      {l.status === 'cancelled' && <StatusBadge tone="negative" label="Отменён" />}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {data.recentLessons.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-lavender">Прошедшие — отметить или изменить</p>
              <div className="space-y-2">
                {data.recentLessons.map((l) => (
                  <Link key={l.id} href={`/app/teacher/lessons/${l.id}`}>
                    <Card className="flex items-center justify-between">
                      <div>
                        <p className="text-white">{formatDate(l.scheduled_at)}</p>
                        <p className="text-sm text-lavender">{l.topic ?? '—'}</p>
                      </div>
                      <StatusBadge
                        tone={l.status === 'completed' ? 'positive' : l.status === 'cancelled' ? 'negative' : 'neutral'}
                        label={l.status === 'completed' ? 'Проведён' : l.status === 'cancelled' ? 'Отменён' : 'Не закрыт'}
                      />
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {data.upcomingLessons.length === 0 && data.recentLessons.length === 0 && (
            <EmptyState icon={CalendarDays} title="Уроков пока нет" />
          )}
        </div>
      )}

      {tab === 'homework' && <HomeworkTab groupId={id} />}
      {tab === 'materials' && <MaterialsTab groupId={id} />}

      <Sheet open={!!pinFor} onClose={() => setPinFor(null)} title={pinFor ? `PIN: ${pinFor.name}` : ''}>
        {!newPin ? (
          <>
            <p className="mb-4 text-sm text-lavender">Старый PIN перестанет работать сразу после сброса.</p>
            <Button fullWidth loading={resetPin.isPending} onClick={() => pinFor && resetPin.mutate(pinFor.id)}>
              Сбросить PIN
            </Button>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm text-lavender">Новый PIN — покажи один раз, дальше только новый сброс:</p>
            <p className="mb-4 text-center font-display text-4xl font-bold tracking-widest text-white">{newPin}</p>
            <Button fullWidth onClick={() => setPinFor(null)}>
              Готово
            </Button>
          </>
        )}
      </Sheet>
    </>
  );
}

function HomeworkTab({ groupId }: { groupId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['homework-list', groupId],
    queryFn: () => api.get<HomeworkListItem[]>(`/homework?group_id=${groupId}`),
  });

  return (
    <div>
      <Link href={`/app/teacher/homework/new?groupId=${groupId}`}>
        <Button variant="secondary" fullWidth className="mb-3">
          <ClipboardList className="size-4" aria-hidden /> Задать домашку
        </Button>
      </Link>

      {isLoading && <SkeletonCard />}
      {data?.length === 0 && <EmptyState icon={ClipboardList} title="Заданий пока не было" />}

      <div className="space-y-2">
        {data?.map((h) => (
          <Link key={h.id} href={`/app/teacher/homework/${h.id}/submissions`}>
            <Card className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{h.title}</p>
                <p className="text-sm text-lavender">
                  Сдано {h.submitted_count} из {h.total_students}
                  {h.deadline_at && ` · до ${formatDate(h.deadline_at)}`}
                </p>
              </div>
              {h.pending_review_count > 0 && <StatusBadge tone="neutral" label={`${h.pending_review_count} на проверке`} />}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MaterialsTab({ groupId }: { groupId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['materials', groupId],
    queryFn: () => api.get<Material[]>(`/materials?group_id=${groupId}`),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/materials', { group_id: groupId, title: title.trim(), url: url.trim() || undefined, description: description.trim() || undefined }),
    onSuccess: () => {
      toast('Материал добавлен', 'success');
      qc.invalidateQueries({ queryKey: ['materials', groupId] });
      setAddOpen(false);
      setTitle('');
      setUrl('');
      setDescription('');
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось добавить материал', 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/materials/${id}`),
    onSuccess: () => {
      toast('Материал удалён', 'success');
      qc.invalidateQueries({ queryKey: ['materials', groupId] });
    },
    onError: () => toast('Не удалось удалить', 'error'),
  });

  return (
    <div>
      <Button variant="secondary" fullWidth className="mb-3" onClick={() => setAddOpen(true)}>
        <Plus className="size-4" aria-hidden /> Добавить материал
      </Button>

      {isLoading && <SkeletonCard />}
      {data?.length === 0 && <EmptyState icon={BookOpen} title="Материалов пока нет" hint="Ссылки на слайды, шаблоны проектов и т.п." />}

      <div className="space-y-2">
        {data?.map((m) => (
          <Card key={m.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-white">{m.title}</p>
                {m.description && <p className="text-sm text-lavender">{m.description}</p>}
                {m.url && (
                  <a href={m.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-lavender hover:text-white hover:underline">
                    Открыть <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </div>
              <button
                onClick={() => remove.mutate(m.id)}
                className="shrink-0 text-muted hover:text-white"
                aria-label="Удалить материал"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Новый материал">
        <div className="space-y-3">
          <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <Input label="Ссылка (необязательно)" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          <label className="block">
            <span className="mb-1.5 block text-sm text-lavender">Описание (необязательно)</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-purple-mid bg-transparent px-4 py-3 text-white outline-none focus:border-purple"
            />
          </label>
          <Button fullWidth disabled={title.trim().length < 2} loading={create.isPending} onClick={() => create.mutate()}>
            Добавить
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
