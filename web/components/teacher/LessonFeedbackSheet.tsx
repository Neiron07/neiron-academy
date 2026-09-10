'use client';

import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import type { LessonFeedbackItem } from '@/lib/types';

interface RosterOption {
  student_id: string;
  full_name: string;
}

export interface FeedbackDraftItem {
  student_id: string | null;
  kind: 'highlight' | 'attention' | 'group_note';
  text: string;
  can_be_public: boolean;
}

export function LessonFeedbackSheet({
  open,
  onClose,
  roster,
  loading,
  existing,
  onSubmit,
  onSkip,
}: {
  open: boolean;
  onClose: () => void;
  roster: RosterOption[];
  loading: boolean;
  existing?: LessonFeedbackItem[];
  onSubmit: (items: FeedbackDraftItem[]) => void;
  onSkip: () => void;
}) {
  const [highlightId, setHighlightId] = useState('');
  const [highlightText, setHighlightText] = useState('');
  const [attentionId, setAttentionId] = useState('');
  const [attentionText, setAttentionText] = useState('');
  const [groupText, setGroupText] = useState('');
  const [canBePublic, setCanBePublic] = useState(false);
  const isEdit = !!existing && existing.length > 0;

  useEffect(() => {
    if (!open) return;
    const highlight = existing?.find((f) => f.kind === 'highlight');
    const attention = existing?.find((f) => f.kind === 'attention');
    const groupNote = existing?.find((f) => f.kind === 'group_note');
    setHighlightId(highlight?.student_id ?? '');
    setHighlightText(highlight?.text ?? '');
    setAttentionId(attention?.student_id ?? '');
    setAttentionText(attention?.text ?? '');
    setGroupText(groupNote?.text ?? '');
    setCanBePublic(existing?.some((f) => f.can_be_public) ?? false);
  }, [open, existing]);

  function submit() {
    const items: FeedbackDraftItem[] = [];
    if (highlightId && highlightText.trim().length >= 3) {
      items.push({ student_id: highlightId, kind: 'highlight', text: highlightText.trim(), can_be_public: canBePublic });
    }
    if (attentionId && attentionText.trim().length >= 3) {
      items.push({ student_id: attentionId, kind: 'attention', text: attentionText.trim(), can_be_public: canBePublic });
    }
    if (groupText.trim().length >= 3) {
      items.push({ student_id: null, kind: 'group_note', text: groupText.trim(), can_be_public: canBePublic });
    }
    if (items.length === 0) return onSkip();
    onSubmit(items);
  }

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? 'Изменить обратную связь' : 'Обратная связь по уроку'}>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm text-lavender">Кто отличился</p>
          <select
            value={highlightId}
            onChange={(e) => setHighlightId(e.target.value)}
            className="mb-2 h-11 w-full rounded-xl border border-purple-mid bg-purple-deep px-3 text-white outline-none focus:border-purple"
          >
            <option value="">Не выбрано</option>
            {roster.map((r) => (
              <option key={r.student_id} value={r.student_id}>
                {r.full_name}
              </option>
            ))}
          </select>
          <input
            placeholder="Одна фраза, за что"
            value={highlightText}
            onChange={(e) => setHighlightText(e.target.value)}
            className="h-11 w-full rounded-xl border border-purple-mid bg-transparent px-3 text-sm text-white placeholder:text-muted outline-none focus:border-purple"
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm text-lavender">Кому нужно внимание</p>
          <select
            value={attentionId}
            onChange={(e) => setAttentionId(e.target.value)}
            className="mb-2 h-11 w-full rounded-xl border border-purple-mid bg-purple-deep px-3 text-white outline-none focus:border-purple"
          >
            <option value="">Не выбрано</option>
            {roster.map((r) => (
              <option key={r.student_id} value={r.student_id}>
                {r.full_name}
              </option>
            ))}
          </select>
          <input
            placeholder="Что стоит поддержать"
            value={attentionText}
            onChange={(e) => setAttentionText(e.target.value)}
            className="h-11 w-full rounded-xl border border-purple-mid bg-transparent px-3 text-sm text-white placeholder:text-muted outline-none focus:border-purple"
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm text-lavender">Комментарий по группе</p>
          <textarea
            rows={2}
            value={groupText}
            onChange={(e) => setGroupText(e.target.value)}
            placeholder="Общее по всей группе"
            className="w-full resize-none rounded-xl border border-purple-mid bg-transparent px-3 py-2 text-sm text-white placeholder:text-muted outline-none focus:border-purple"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-lavender">
          <input
            type="checkbox"
            checked={canBePublic}
            onChange={(e) => setCanBePublic(e.target.checked)}
            className="size-4 rounded border-purple-mid accent-purple"
          />
          Можно показать в соцсетях школы
        </label>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onSkip} disabled={loading}>
            {isEdit ? 'Закрыть' : 'Пропустить'}
          </Button>
          <Button fullWidth loading={loading} onClick={submit}>
            Сохранить
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
