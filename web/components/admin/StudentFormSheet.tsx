'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { AdminStudentRow, Branch, TeacherGroup } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useToast } from '@/components/ui/Toast';
import { almatyDayKey } from '@/lib/format';

const STATUSES = [
  { id: 'active', label: 'Учится' },
  { id: 'paused', label: 'Приостановлено' },
  { id: 'left', label: 'Ушёл' },
] as const;

export function StudentFormSheet({
  student,
  onClose,
}: {
  student: AdminStudentRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [paymentNoteAt, setPaymentNoteAt] = useState('');
  const [nextPaymentAt, setNextPaymentAt] = useState('');
  const [branchId, setBranchId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]['id']>('active');
  const [isActive, setIsActive] = useState(true);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [referredByPhone, setReferredByPhone] = useState('');
  const [error, setError] = useState('');

  const { data: branches } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => api.get<Branch[]>('/admin/branches'),
    enabled: !!student,
  });
  const { data: groups } = useQuery({
    queryKey: ['admin-groups-list'],
    queryFn: () => api.get<TeacherGroup[]>('/teacher/groups'),
    enabled: !!student,
  });

  useEffect(() => {
    if (!student) return;
    setFullName(student.full_name);
    // almatyDayKey, не slice(0,10): pg возвращает date-колонку как Date, и её
    // сериализация в UTC ISO может сдвинуться на день назад относительно
    // календарной даты в Алматы (TZ сервера +5) — нужно явно пересчитать.
    setBirthDate(student.birth_date ? almatyDayKey(student.birth_date) : '');
    setGender(student.gender ?? '');
    setPaymentNoteAt(student.payment_note_at ? almatyDayKey(student.payment_note_at) : '');
    setNextPaymentAt(student.next_payment_at ? almatyDayKey(student.next_payment_at) : '');
    setBranchId(student.branch_id ?? '');
    setGroupId(student.group_id ?? '');
    setStatus((student.status as (typeof STATUSES)[number]['id']) ?? 'active');
    setIsActive(student.is_active);
    setParentName(student.parents[0]?.full_name ?? '');
    setParentPhone(student.parents[0]?.phone.replace(/\D/g, '') ?? '');
    setReferredByPhone(student.referred_by_phone?.replace(/\D/g, '') ?? '');
    setError('');
  }, [student]);

  const parentPartial = (parentName.trim() !== '') !== (parentPhone.trim() !== '');

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/admin/students/${student!.id}`, {
        full_name: fullName.trim(),
        birth_date: birthDate || null,
        gender: gender || null,
        payment_note_at: paymentNoteAt || null,
        next_payment_at: nextPaymentAt || null,
        branch_id: branchId || undefined,
        group_id: groupId || null,
        status,
        is_active: isActive,
        parent: parentName.trim() && parentPhone.trim() ? { full_name: parentName.trim(), phone: parentPhone.trim() } : undefined,
        referred_by_phone: referredByPhone.trim() || null,
      }),
    onSuccess: () => {
      toast('Данные ученика обновлены', 'success');
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      qc.invalidateQueries({ queryKey: ['admin-group-detail'] });
      onClose();
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : 'Не удалось сохранить';
      setError(message);
      toast(message, 'error');
    },
  });

  return (
    <Sheet open={!!student} onClose={onClose} title="Редактировать ученика">
      <div className="space-y-3">
        <Input label="Имя ученика" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
        <Input label="Дата рождения" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <div>
          <span className="mb-1.5 block text-sm text-lavender">Пол (необязательно)</span>
          <div className="flex gap-2">
            {([['male', 'Мальчик'], ['female', 'Девочка']] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setGender((g) => (g === id ? '' : id))}
                className={`flex-1 rounded-lg border py-2 text-sm ${gender === id ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Input
          label="Последняя оплата — заметка (необязательно)"
          type="date"
          value={paymentNoteAt}
          onChange={(e) => setPaymentNoteAt(e.target.value)}
          hint="Просто пометка для себя, не связана с реальной историей платежей"
        />
        <Input
          label="Следующая оплата (необязательно)"
          type="date"
          value={nextPaymentAt}
          onChange={(e) => setNextPaymentAt(e.target.value)}
          hint="Плановая дата — выставляется вручную, для контроля"
        />
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
          <span className="mb-1.5 block text-sm text-lavender">Группа</span>
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
        <div>
          <span className="mb-1.5 block text-sm text-lavender">Учится</span>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`flex-1 rounded-lg border py-2 text-sm ${status === s.id ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-purple-mid/40 pt-3">
          <p className="mb-2 text-sm text-lavender">Родитель</p>
          <Input label="Имя родителя" value={parentName} onChange={(e) => setParentName(e.target.value)} className="mb-3" />
          <PhoneInput value={parentPhone} onChange={setParentPhone} />
          {parentPartial && (
            <p className="mt-2 text-sm text-white">Заполните и имя, и телефон, иначе изменения родителя не сохранятся.</p>
          )}
        </div>
        <div className="border-t border-purple-mid/40 pt-3">
          <p className="mb-2 text-sm text-lavender">Реферальная программа (необязательно)</p>
          <PhoneInput
            label="Телефон родителя, который привёл"
            value={referredByPhone}
            onChange={setReferredByPhone}
          />
          <p className="mt-2 text-xs text-muted">Этот родитель уже должен быть в системе. Оставьте поле пустым, чтобы убрать привязку.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-lavender">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 rounded border-purple-mid accent-purple"
          />
          Активен (снимите галочку, чтобы отчислить без удаления истории)
        </label>
        {error && <p className="text-sm text-white">{error}</p>}
        <Button
          fullWidth
          size="lg"
          disabled={fullName.trim().length < 2 || parentPartial}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          Сохранить
        </Button>
      </div>
    </Sheet>
  );
}
