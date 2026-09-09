'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

function NewHomeworkForm() {
  const router = useRouter();
  const toast = useToast();
  const groupId = useSearchParams().get('groupId') ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>('/homework', {
        group_id: groupId,
        title: title.trim(),
        description: description.trim() || undefined,
        link: link.trim() || undefined,
        deadline_at: deadline ? new Date(deadline).toISOString() : undefined,
      }),
    onSuccess: (res) => {
      toast('Домашка выдана', 'success');
      router.push(`/app/teacher/homework/${res.id}/submissions`);
    },
    onError: () => setError('Не удалось создать задание'),
  });

  return (
    <>
      <TopBar title="Новая домашка" />
      <div className="space-y-4">
        <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Описание</span>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-purple-mid bg-transparent px-4 py-3 text-white outline-none focus:border-purple"
          />
        </label>
        <Input label="Ссылка (необязательно)" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
        <Input label="Дедлайн (необязательно)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        {error && <p className="text-sm text-white">{error}</p>}
        <Button
          fullWidth
          size="lg"
          disabled={!groupId || title.trim().length < 3}
          loading={create.isPending}
          onClick={() => create.mutate()}
        >
          Выдать задание
        </Button>
      </div>
    </>
  );
}

export default function NewHomeworkPage() {
  return (
    <Suspense>
      <NewHomeworkForm />
    </Suspense>
  );
}
