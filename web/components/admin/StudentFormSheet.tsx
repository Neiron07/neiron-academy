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
  const [branchId, setBranchId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]['id']>('active');
  const [isActive, setIsActive] = useState(true);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
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
    setBirthDate(student.birth_date ? student.birth_date.slice(0, 10) : '');
    setBranchId(student.branch_id ?? '');
    setGroupId(student.group_id ?? '');
    setStatus((student.status as (typeof STATUSES)[number]['id']) ?? 'active');
    setIsActive(student.is_active);
    setParentName(student.parents[0]?.full_name ?? '');
    setParentPhone(student.parents[0]?.phone.replace(/\D/g, '') ?? '');
    setError('');
  }, [student]);

  const parentPartial = (parentName.trim() !== '') !== (parentPhone.trim() !== '');

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/admin/students/${student!.id}`, {
        full_name: fullName.trim(),
        birth_date: birthDate || null,
        branch_id: branchId || undefined,
        group_id: groupId || null,
        status,
        is_active: isActive,
        parent: parentName.trim() && parentPhone.trim() ? { full_name: parentName.trim(), phone: parentPhone.trim() } : undefined,
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
