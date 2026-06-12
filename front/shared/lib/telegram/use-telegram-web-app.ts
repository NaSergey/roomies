'use client';

import { useEffect } from 'react';

export function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

// Один раз на маунте инициализирует SDK Telegram (ready + expand). Тему не
// применяет — палитра зафиксирована в globals.css. Возвращать сам объект не
// нужно: потребители читают его через getWebApp() по требованию.
export function useTelegramWebApp() {
  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;
    wa.ready();
    wa.expand();
  }, []);
}
