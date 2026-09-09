'use client';

import { useState } from 'react';
import { authApi } from '@/lib/auth-client';
import { ApiError } from '@/lib/api';
import { ROLE_HOME } from '@/lib/session';
import { Button } from '@/components/ui/Button';
import { PinInput } from '@/components/ui/PinInput';
import { PhoneInput } from '@/components/ui/PhoneInput';

export function ParentLoginForm() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (phone.replace(/\D/g, '').length < 10) return setError('Введите номер телефона');
    if (pin.length !== 4) return setError('PIN — это 4 цифры');

    setLoading(true);
    try {
      const { user } = await authApi.loginParent(phone, pin);
      window.location.href = ROLE_HOME[user.role];
    } catch (e) {
      setPin('');
      setError(e instanceof ApiError ? e.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PhoneInput value={phone} onChange={setPhone} autoFocus />
      <div>
        <span className="mb-1.5 block text-sm text-lavender">PIN-код</span>
        <PinInput value={pin} onChange={setPin} />
      </div>
      {error && <p className="text-center text-sm text-white">{error}</p>}
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Войти
      </Button>
      <p className="text-center text-sm text-muted">Забыли PIN? Администратор школы сбросит его за секунду.</p>
    </form>
  );
}
