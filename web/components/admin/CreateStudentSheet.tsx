'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { CreateStudentResponse, TeacherGroup } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { waLink } from '@/lib/constants';

export function CreateStudentSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [groupId, setGroupId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [result, setResult] = useState<CreateStudentResponse | null>(null);

  const { data: groups } = useQuery({
    queryKey: ['admin-groups-list'],
    queryFn: () => api.get<TeacherGroup[]>('/teacher/groups'),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<CreateStudentResponse>('/admin/students', {
        full_name: fullName.trim(),
        birth_date: birthDate || undefined,
        group_id: groupId || undefined,
        parent:
          parentName.trim() && parentPhone.trim()
            ? { full_name: parentName.trim(), phone: parentPhone.trim() }
            : undefined,
      }),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ['admin-students'] });
    },
  });

  function reset() {
    setFullName('');
    setBirthDate('');
    setGroupId('');
    setParentName('');
    setParentPhone('');
    setResult(null);
  }

  if (result) {
    return (
      <Sheet open={open} onClose={() => { reset(); onClose(); }} title="Ученик создан">
        <div className="space-y-3">
          <p className="text-sm text-lavender">Логин и PIN показываются один раз — распечатай карточку сейчас.</p>
          <div id="student-card" className="rounded-2xl border border-purple-mid p-4 text-center">
            <p className="font-medium text-white">{fullName}</p>
            <p className="mt-2 text-sm text-lavender">Логин</p>
            <p className="font-display text-xl font-bold text-white">{result.login}</p>
            <p className="mt-2 text-sm text-lavender">PIN</p>
            <p className="font-display text-3xl font-bold tracking-widest text-white">{result.pin}</p>
          </div>
          {result.parent_pin && (
            <div className="rounded-2xl border border-purple-mid p-4 text-center">
              <p className="text-sm text-lavender">PIN родителя ({parentPhone || 'указанный телефон'})</p>
              <p className="font-display text-3xl font-bold tracking-widest text-white">{result.parent_pin}</p>
              <p className="mt-1 text-sm text-muted">Родитель входит по этому телефону и PIN — так же, как ученик</p>
              {parentPhone && (
                <a
                  href={waLink(
                    `Neiron Academy\nВаш вход в личный кабинет — этот номер и PIN:\nPIN: ${result.parent_pin}`,
                    parentPhone,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block"
                >
                  <Button variant="secondary" fullWidth>
                    <MessageCircle className="size-4" aria-hidden /> Отправить в WhatsApp
                  </Button>
                </a>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => window.print()}>
              Печать карточки
            </Button>
            <Button fullWidth onClick={() => { reset(); onClose(); }}>
              Готово
            </Button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="Новый ученик">
      <div className="space-y-3">
        <Input label="Имя ученика" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
        <Input label="Дата рождения" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Группа (необязательно)</span>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
          >
            <option value="">Без группы</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.students_count}/{g.capacity})
              </option>
            ))}
          </select>
        </label>
        <div className="border-t border-purple-mid/40 pt-3">
          <p className="mb-2 text-sm text-lavender">Родитель (необязательно)</p>
          <Input label="Имя родителя" value={parentName} onChange={(e) => setParentName(e.target.value)} className="mb-3" />
          <PhoneInput value={parentPhone} onChange={setParentPhone} />
        </div>
        <Button fullWidth size="lg" disabled={fullName.trim().length < 2} loading={create.isPending} onClick={() => create.mutate()}>
          Создать
        </Button>
      </div>
    </Sheet>
  );
}
