'use client';

import { apiFetch } from './client';

// Зеркало AuthTokensDto с бэка (src/auth/dto/telegram-login.dto.ts).
// Дублирование намеренное — на фронт не тянем nest/swagger.
export type AuthTokens = {
  accessToken: string;
  expiresIn: number;
  userId: number;
  telegramId: string | null;
  isNew: boolean;
};

export type CurrentUser = {
  id: number;
  telegramId: string | null;
};

export function loginWithTelegram(initData: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/telegram', {
    method: 'POST',
    auth: false,
    body: { initData },
  });
}

export function registerWithEmail(payload: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/register', {
    method: 'POST',
    auth: false,
    body: payload,
  });
}

export function loginWithEmail(payload: {
  email: string;
  password: string;
}): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    auth: false,
    body: payload,
  });
}

export function fetchMe(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/auth/me', { method: 'GET' });
}
