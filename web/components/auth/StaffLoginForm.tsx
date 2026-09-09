'use client';

import { useState } from 'react';
import { authApi } from '@/lib/auth-client';
import { ApiError } from '@/lib/api';
import { ROLE_HOME } from '@/lib/session';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';

export function StaffLoginForm() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (phone.replace(/\D/g, '').length < 10) return setError('Введите номер телефона');
    if (password.length < 6) return setError('Пароль слишком короткий');

    setLoading(true);
    try {
      const { user } = await authApi.loginStaff(phone, password);
      window.location.href = ROLE_HOME[user.role];
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PhoneInput value={phone} onChange={setPhone} autoFocus />
      <Input
        label="Пароль"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-center text-sm text-white">{error}</p>}
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Войти
      </Button>
    </form>
  );
}
