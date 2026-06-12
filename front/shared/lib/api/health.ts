'use client';

import { apiFetch } from './client';

// GET / на NestJS возвращает строку "Hello World!" (AppController#getHello).
// Используем как простой ping-канал без авторизации.
export function pingBackend(): Promise<string> {
  return apiFetch<string>('/', { method: 'GET', auth: false });
}
