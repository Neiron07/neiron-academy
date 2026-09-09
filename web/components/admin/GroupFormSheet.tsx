'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { AdminStaff, Branch, TeacherGroup } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function GroupFormSheet({ group, onClose }: { group: TeacherGroup | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [capacity, setCapacity] = useState(6);
  const [teacherId, setTeacherId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState('');

  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get<AdminStaff[]>('/admin/teachers'),
    enabled: !!group,
  });
  const { data: branches } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => api.get<Branch[]>('/admin/branches'),
    enabled: !!group,
  });

  useEffect(() => {
    if (!group) return;
    setName(group.name);
    setRoom(group.room ?? '');
    setCapacity(group.capacity);
    setTeacherId(group.teacher_id ?? '');
    setError('');
  }, [group]);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/admin/groups/${group!.id}`, {
        name: name.trim(),
        room: room.trim() || null,
        capacity,
        teacher_id: teacherId || null,
        branch_id: branchId || undefined,
      }),
    onSuccess: () => {
      toast('Группа обновлена', 'success');
      qc.invalidateQueries({ queryKey: ['admin-groups-list'] });
      onClose();
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : 'Не удалось сохранить';
      setError(message);
      toast(message, 'error');
    },
  });

  return (
    <Sheet open={!!group} onClose={onClose} title="Редактировать группу">
      <div className="space-y-3">
        <Input label="Название" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Филиал</span>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
          >
            <option value="">Не менять</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-lavender">Преподаватель</span>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-white outline-none focus:border-purple"
          >
            <option value="">Не назначен</option>
            {teachers?.filter((t) => t.is_active || t.id === teacherId).map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-3">
          <Input label="Кабинет" value={room} onChange={(e) => setRoom(e.target.value)} className="flex-1" />
          <Input label="Вместимость" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-28" />
        </div>
        {error && <p className="text-sm text-white">{error}</p>}
        <Button fullWidth size="lg" disabled={name.trim().length < 2} loading={save.isPending} onClick={() => save.mutate()}>
          Сохранить
        </Button>
      </div>
    </Sheet>
  );
}
