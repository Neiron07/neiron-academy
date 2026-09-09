'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { waLink } from '@/lib/constants';

export interface ResetPinTarget {
  id: string;
  name: string;
  /** Телефон, на который можно отправить PIN в WhatsApp — свой (родитель) или родителя (ученик). */
  phone?: string | null;
  /** Для ученика — логин, чтобы сообщение в WhatsApp было самодостаточным. */
  login?: string;
}

export function ResetPinSheet({ target, onClose }: { target: ResetPinTarget | null; onClose: () => void }) {
  const toast = useToast();
  const [newPin, setNewPin] = useState<string | null>(null);

  const resetPin = useMutation({
    mutationFn: (id: string) => api.post<{ pin: string }>(`/admin/users/${id}/reset-pin`),
    onSuccess: (res) => setNewPin(res.pin),
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Не удалось сбросить PIN', 'error'),
  });

  function close() {
    setNewPin(null);
    onClose();
  }

  const message =
    target && newPin
      ? target.login
        ? `Neiron Academy\nВход в личный кабинет ${target.name}:\nЛогин: ${target.login}\nPIN: ${newPin}`
        : `Neiron Academy\nВаш вход в личный кабинет — телефон и PIN:\nPIN: ${newPin}`
      : '';

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
          <div className="flex gap-2">
            {target?.phone && (
              <a href={waLink(message, target.phone)} target="_blank" rel="noreferrer" className="flex-1">
                <Button variant="secondary" fullWidth>
                  <MessageCircle className="size-4" aria-hidden /> В WhatsApp
                </Button>
              </a>
            )}
            <Button fullWidth onClick={close}>
              Готово
            </Button>
          </div>
        </>
      )}
    </Sheet>
  );
}
