'use client';

import { useState } from 'react';
import { authApi } from '@/lib/auth-client';
import { ApiError } from '@/lib/api';
import { ROLE_HOME } from '@/lib/session';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PinInput } from '@/components/ui/PinInput';

export function StudentLoginForm() {
  const [login, setLogin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (login.trim().length < 2) return setError('Введи логин');
    if (pin.length !== 4) return setError('PIN — это 4 цифры');

    setLoading(true);
    try {
      const { user } = await authApi.loginStudent(login.trim(), pin);
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
      <Input
        label="Логин"
        placeholder="aisultan12"
        autoComplete="username"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        autoFocus
      />
      <div>
        <span className="mb-1.5 block text-sm text-lavender">PIN-код</span>
        <PinInput value={pin} onChange={setPin} />
      </div>
      {error && <p className="text-center text-sm text-white">{error}</p>}
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Войти
      </Button>
      <p className="text-center text-sm text-muted">Забыл PIN? Попроси преподавателя, он сбросит за секунду.</p>
    </form>
  );
}
