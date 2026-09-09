'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

export function ResetPinSheet({
  target,
  onClose,
}: {
  target: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const [newPin, setNewPin] = useState<string | null>(null);

  const resetPin = useMutation({
    mutationFn: (id: string) => api.post<{ pin: string }>(`/admin/users/${id}/reset-pin`),
    onSuccess: (res) => setNewPin(res.pin),
  });

  function close() {
    setNewPin(null);
    onClose();
  }

  return (
    <Sheet open={!!target} onClose={close} title={target ? `PIN: ${target.name}` : ''}>
      {!newPin ? (
        <>
          <p className="mb-4 text-sm text-lavender">Старый PIN перестанет работать сразу после сброса.</p>
          <Button fullWidth loading={resetPin.isPending} onClick={() => target && resetPin.mutate(target.id)}>
            Сбросить PIN
          </Button>
        </>
      ) : (
        <>
          <p className="mb-2 text-sm text-lavender">Новый PIN — покажи один раз, дальше только новый сброс:</p>
          <p className="mb-4 text-center font-display text-4xl font-bold tracking-widest text-white">{newPin}</p>
          <Button fullWidth onClick={close}>
            Готово
          </Button>
        </>
      )}
    </Sheet>
  );
}
