/** Обращение к настоящему бэкенду. Используется только на сервере (route handlers), никогда в браузере. */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

export function backendFetch(path: string, init?: RequestInit) {
  return fetch(`${BACKEND_URL}${path}`, init);
}
