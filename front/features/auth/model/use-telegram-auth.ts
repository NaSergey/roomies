'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  type AuthTokens,
  getAccessToken,
  loginWithTelegram,
  setAccessToken,
} from '@/shared/lib/api';
import { getWebApp } from '@/shared/lib/telegram';

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';

export type AuthState = {
  status: AuthStatus;
  tokens: AuthTokens | null;
  error: string | null;
};

// Логин делается ровно один раз на старте Mini App: достаём initData из Telegram
// SDK, отправляем на /auth/telegram, сохраняем JWT. Стартовое состояние всегда
// 'idle' — иначе SSR (без localStorage) и клиент (с localStorage) дадут разный
// HTML и React поломает гидрацию.
export function useTelegramAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    status: 'idle',
    tokens: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    // Есть токен с прошлой сессии — используем его и НЕ логинимся заново.
    // Telegram отдаёт initData с фиксированным auth_date; в долгой сессии (или при
    // dev-HMR) он легко становится старше 24ч, и повторный /auth/telegram падает
    // «initData expired», хотя JWT ещё живёт 7 дней. Если токен всё же протух —
    // apiFetch вычистит его на первом 401, и следующий старт залогинится заново.
    if (getAccessToken()) {
      setState({ status: 'authenticated', tokens: null, error: null });
      return;
    }

    const wa = getWebApp();
    const initData = wa?.initData;
    if (!initData) {
      setState({
        status: 'error',
        tokens: null,
        error: 'Mini App открыт вне Telegram: нет initData',
      });
      return;
    }

    setState({ status: 'authenticating', tokens: null, error: null });

    loginWithTelegram(initData)
      .then((tokens) => {
        if (cancelled) return;
        setAccessToken(tokens.accessToken);
        setState({ status: 'authenticated', tokens, error: null });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message =
          e instanceof ApiError
            ? `${e.status}: ${e.message}`
            : e instanceof Error
              ? e.message
              : 'Не удалось авторизоваться';
        setState({ status: 'error', tokens: null, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
