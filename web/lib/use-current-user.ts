'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { PublicUser } from './session';

/** Кто сейчас залогинен — для сравнений «это моя задача» на клиенте. */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<PublicUser>('/auth/me'),
    staleTime: Infinity,
  });
}
