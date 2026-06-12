'use client';

import { apiFetch } from './client';

// Зеркало AuthTokensDto с бэка (src/auth/dto/telegram-login.dto.ts).
// Дублирование намеренное — на фронт не тянем nest/swagger.
export type AuthTokens = {
  accessToken: string;
  expiresIn: number;
  userId: number;
  telegramId: string;
  isNew: boolean;
};

export type CurrentUser = {
  id: number;
  telegramId: string;
};

export function loginWithTelegram(initData: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/telegram', {
    method: 'POST',
    auth: false,
    body: { initData },
  });
}

export function fetchMe(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/auth/me', { method: 'GET' });
}
