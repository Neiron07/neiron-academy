'use client';

import { useRouter } from 'next/navigation';
import { authApi } from './auth-client';

export function useLogout() {
  const router = useRouter();
  return async () => {
    try {
      await authApi.logout();
    } catch {
      // выходим локально даже если бэкенд недоступен
    }
    router.push('/login');
    router.refresh();
  };
}
