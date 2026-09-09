export type Role = 'admin' | 'teacher' | 'student' | 'parent';

export const COOKIE_TOKEN = 'neiron_token';
export const COOKIE_ROLE = 'neiron_role';

/** Срок жизни куки по ролям (сек) — зеркало src/config.ts бэкенда. Ребёнок не должен вводить PIN каждый день. */
export const TOKEN_TTL: Record<Role, number> = {
  student: 90 * 24 * 3600,
  parent: 30 * 24 * 3600,
  teacher: 7 * 24 * 3600,
  admin: 7 * 24 * 3600,
};

export const ROLE_HOME: Record<Role, string> = {
  student: '/app/student',
  parent: '/app/parent',
  teacher: '/app/teacher',
  admin: '/app/admin',
};

export interface PublicUser {
  id: string;
  role: Role;
  full_name: string;
}
