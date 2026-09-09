'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { AdminStudentRow, Branch } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

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
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  const { data: branches } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => api.get<Branch[]>('/admin/branches'),
    enabled: !!student,
  });

  useEffect(() => {
    if (!student) return;
    setFullName(student.full_name);
    setBirthDate(student.birth_date ? student.birth_date.slice(0, 10) : '');
    setBranchId(student.branch_id ?? '');
    setIsActive(student.is_active);
    setError('');
  }, [student]);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/admin/students/${student!.id}`, {
        full_name: fullName.trim(),
        birth_date: birthDate || null,
        branch_id: branchId || undefined,
        is_active: isActive,
      }),
    onSuccess: () => {
      toast('Данные ученика обновлены', 'success');
      qc.invalidateQueries({ queryKey: ['admin-students'] });
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
        <Button fullWidth size="lg" disabled={fullName.trim().length < 2} loading={save.isPending} onClick={() => save.mutate()}>
          Сохранить
        </Button>
      </div>
    </Sheet>
  );
}
