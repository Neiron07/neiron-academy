'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { AdminStaff } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useToast } from '@/components/ui/Toast';

const ROLES: { id: 'teacher' | 'admin'; label: string }[] = [
  { id: 'teacher', label: 'Преподаватель' },
  { id: 'admin', label: 'Администратор' },
];

export function TeacherFormSheet({
  open,
  existing,
  onClose,
}: {
  open: boolean;
  existing: AdminStaff | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setFullName(existing.full_name);
      setPhone(existing.phone.replace(/\D/g, ''));
      setRole(existing.role);
    } else {
      setFullName('');
      setPhone('');
      setRole('teacher');
    }
    setPassword('');
    setError('');
  }, [open, existing]);

  const save = useMutation({
    mutationFn: () =>
      existing
        ? api.patch<AdminStaff>(`/admin/teachers/${existing.id}`, {
            full_name: fullName.trim(),
            phone,
            role,
            password: password.trim() || undefined,
          })
        : api.post<AdminStaff>('/admin/teachers', {
            full_name: fullName.trim(),
            phone,
            role,
            password: password.trim(),
          }),
    onSuccess: () => {
      toast(existing ? 'Данные обновлены' : 'Сотрудник добавлен', 'success');
      qc.invalidateQueries({ queryKey: ['admin-teachers'] });
      onClose();
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : 'Не удалось сохранить';
      setError(message);
      toast(message, 'error');
    },
  });

  const canSave = fullName.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10 && (existing || password.trim().length >= 8);

  return (
    <Sheet open={open} onClose={onClose} title={existing ? 'Редактировать сотрудника' : 'Новый сотрудник'}>
      <div className="space-y-3">
        <Input label="Имя" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
        <PhoneInput value={phone} onChange={setPhone} />
        <div>
          <span className="mb-1.5 block text-sm text-lavender">Роль</span>
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`flex-1 rounded-lg border py-2 text-sm ${role === r.id ? 'border-purple bg-purple text-white' : 'border-purple-mid text-lavender'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <Input
          label={existing ? 'Новый пароль (необязательно)' : 'Пароль'}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={existing ? 'Оставь пустым, если менять не нужно' : 'Минимум 8 символов'}
        />
        {error && <p className="text-sm text-white">{error}</p>}
        <Button fullWidth size="lg" disabled={!canSave} loading={save.isPending} onClick={() => save.mutate()}>
          Сохранить
        </Button>
      </div>
    </Sheet>
  );
}
