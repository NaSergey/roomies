'use client';

// JWT живёт в localStorage. Для Mini App это ок: WebView браузера сохраняет его
// между сессиями, а серверные компоненты к нему не обращаются.
const TOKEN_KEY = 'roomies.accessToken';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}
