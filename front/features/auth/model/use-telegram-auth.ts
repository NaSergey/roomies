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

    const wa = getWebApp();
    const initData = wa?.initData;

    // Нет initData (открыто вне Telegram) — перелогиниться нечем. Если есть
    // токен с прошлой сессии — работаем по нему, иначе честно ошибка.
    if (!initData) {
      if (getAccessToken()) {
        setState({ status: 'authenticated', tokens: null, error: null });
      } else {
        setState({
          status: 'error',
          tokens: null,
          error: 'Mini App открыт вне Telegram: нет initData',
        });
      }
      return;
    }

    // initData есть — ВСЕГДА логинимся заново, чтобы освежить JWT. Иначе
    // протухший/битый токен в localStorage залипает навсегда: приложение
    // считает себя authenticated, а каждый запрос ловит 401.
    setState({ status: 'authenticating', tokens: null, error: null });

    loginWithTelegram(initData)
      .then((tokens) => {
        if (cancelled) return;
        setAccessToken(tokens.accessToken);
        setState({ status: 'authenticated', tokens, error: null });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // Логин не удался, но валидный токен мог остаться с прошлого раза —
        // пробуем работать по нему, не роняя весь экран в ошибку.
        if (getAccessToken()) {
          setState({ status: 'authenticated', tokens: null, error: null });
          return;
        }
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
