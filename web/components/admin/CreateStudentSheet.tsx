'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Branch, CreateStudentResponse, TeacherGroup } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { CopyButton } from '@/components/ui/CopyButton';
import { useToast } from '@/components/ui/Toast';
import { waLink } from '@/lib/constants';

export function CreateStudentSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<CreateStudentResponse | null>(null);

  const { data: branches } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => api.get<Branch[]>('/admin/branches'),
    enabled: open,
  });
  const { data: groups } = useQuery({
    queryKey: ['admin-groups-list'],
    queryFn: () => api.get<TeacherGroup[]>('/teacher/groups'),
    enabled: open,
  });

  useEffect(() => {
    if (open && branches && branches.length > 0 && !branchId) setBranchId(branches[0]!.id);
  }, [open, branches, branchId]);

  const create = useMutation({
    mutationFn: () =>
      api.post<CreateStudentResponse>('/admin/students', {
        full_name: fullName.trim(),
        birth_date: birthDate || undefined,
        branch_id: branchId || undefined,
        group_id: groupId || undefined,
        parent:
          parentName.trim() && parentPhone.trim()
            ? { full_name: parentName.trim(), phone: parentPhone.trim() }
            : undefined,
      }),
    onSuccess: (res) => {
      setError('');
      setResult(res);
      qc.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : 'Не удалось создать ученика. Попробуйте ещё раз.';
      setError(message);
      toast(message, 'error');
    },
  });

  function reset() {
    setFullName('');
    setBirthDate('');
    setBranchId('');
    setGroupId('');
    setParentName('');
    setParentPhone('');
    setError('');
    setResult(null);
  }

  const parentPartial = (parentName.trim() !== '') !== (parentPhone.trim() !== '');

  if (result) {
    return (
      <Sheet open={open} onClose={() => { reset(); onClose(); }} title="Ученик создан">
        <div className="space-y-3">
          <p className="text-sm text-lavender">Логин и PIN показываются один раз — скопируй или распечатай карточку сейчас.</p>
          <div id="student-card" className="rounded-2xl border border-purple-mid p-4 text-center">
            <p className="font-medium text-white">{fullName}</p>
            <p className="mt-2 text-sm text-lavender">Логин</p>
            <p className="font-display text-xl font-bold text-white">{result.login}</p>
            <p className="mt-2 text-sm text-lavender">PIN</p>
            <p className="font-display text-3xl font-bold tracking-widest text-white">{result.pin}</p>
            <div className="mt-3 flex justify-center gap-2 no-print">
              <CopyButton text={`Логин: ${result.login}\nPIN: ${result.pin}`} label="Скопировать логин и PIN" />
              {parentPhone && (
                <a
                  href={waLink(`Neiron Academy\nВход в личный кабинет ${fullName}:\nЛогин: ${result.login}\nPIN: ${result.pin}`, parentPhone)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="secondary" size="sm">
                    <MessageCircle className="size-3.5" aria-hidden /> В WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>
          {result.parent_pin && (
            <div className="rounded-2xl border border-purple-mid p-4 text-center">
              <p className="text-sm text-lavender">PIN родителя ({parentPhone || 'указанный телефон'})</p>
              <p className="font-display text-3xl font-bold tracking-widest text-white">{result.parent_pin}</p>
              <p className="mt-1 text-sm text-muted">Родитель входит по этому телефону и PIN — так же, как ученик</p>
              <div className="mt-3 flex justify-center gap-2 no-print">
                <CopyButton text={`Телефон: ${parentPhone}\nPIN: ${result.parent_pin}`} label="Скопировать" />
                {parentPhone && (
                  <a
                    href={waLink(
                      `Neiron Academy\nВаш вход в личный кабинет — этот номер и PIN:\nPIN: ${result.parent_pin}`,
                      parentPhone,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="secondary" size="sm">
                      <MessageCircle className="size-3.5" aria-hidden /> В WhatsApp
                    </Button>
                  </a>
                )}
              </div>
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
          <span className="mb-1.5 block text-sm text-lavender">Филиал</span>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
          >
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
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
          {parentPartial && (
            <p className="mt-2 text-sm text-white">
              Чтобы создать родителя, заполните и имя, и телефон — иначе поле проигнорируется.
            </p>
          )}
        </div>
        {error && <p className="text-sm text-white">{error}</p>}
        <Button
          fullWidth
          size="lg"
          disabled={fullName.trim().length < 2 || parentPartial}
          loading={create.isPending}
          onClick={() => create.mutate()}
        >
          Создать
        </Button>
      </div>
    </Sheet>
  );
}
