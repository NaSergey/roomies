'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  type AuthTokens,
  clearAccessToken,
  fetchMe,
  getAccessToken,
  loginWithEmail,
  loginWithTelegram,
  registerWithEmail,
  setAccessToken,
} from '@/shared/lib/api';
import { getWebApp } from '@/shared/lib/telegram';

export type AuthStatus =
  | 'idle'
  | 'authenticating'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

export type AuthState = {
  status: AuthStatus;
  tokens: AuthTokens | null;
  error: string | null;
  // Отдельно от status: сабмит формы логина/регистрации в процессе. Не переиспользуем
  // 'authenticating', иначе форма на секунду подменяется сплэш-скрином (тот статус
  // относится к автологину на маунте).
  submitting: boolean;
};

// Единая точка входа в приложение:
//  - есть сохранённый токен → ПРОВЕРЯЕМ его на сервере (/auth/me) и только потом
//    считаем сессию живой;
//  - открыто из Telegram Mini App (есть initData) → логинимся через /auth/telegram;
//  - иначе (обычный браузер) → unauthenticated, экран показывает форму входа/регистрации.
export function useAppAuth() {
  const [state, setState] = useState<AuthState>({
    status: 'idle',
    tokens: null,
    error: null,
    submitting: false,
  });

  useEffect(() => {
    let cancelled = false;

    // Логин через Telegram initData — или переход в unauthenticated, если мы в браузере.
    const loginViaTelegramOrFallback = () => {
      const wa = getWebApp();
      const initData = wa?.initData;
      if (!initData) {
        setState((s) => ({ ...s, status: 'unauthenticated', error: null }));
        return;
      }

      setState((s) => ({ ...s, status: 'authenticating', error: null }));
      loginWithTelegram(initData)
        .then((tokens) => {
          if (cancelled) return;
          setAccessToken(tokens.accessToken);
          setState((s) => ({ ...s, status: 'authenticated', tokens, error: null }));
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setState((s) => ({ ...s, status: 'error', error: extractError(e) }));
        });
    };

    // Наличие строки в localStorage НЕ значит, что сессия жива: токен мог истечь,
    // быть отозванным (logout-all / смена пароля) или относиться к пересозданной
    // базе. Единственный источник истины — сервер.
    if (getAccessToken()) {
      setState((s) => ({ ...s, status: 'authenticating', error: null }));
      fetchMe()
        .then(() => {
          if (cancelled) return;
          setState((s) => ({ ...s, status: 'authenticated', error: null }));
        })
        .catch(() => {
          if (cancelled) return;
          clearAccessToken();
          loginViaTelegramOrFallback();
        });
      return () => {
        cancelled = true;
      };
    }

    loginViaTelegramOrFallback();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((email: string, password: string) => {
    setState((s) => ({ ...s, submitting: true, error: null }));
    return loginWithEmail({ email, password })
      .then((tokens) => {
        setAccessToken(tokens.accessToken);
        setState((s) => ({
          ...s,
          status: 'authenticated',
          tokens,
          error: null,
          submitting: false,
        }));
      })
      .catch((e: unknown) => {
        const error = extractError(e);
        setState((s) => ({ ...s, error, submitting: false }));
        throw e;
      });
  }, []);

  const register = useCallback(
    (email: string, password: string, name: string) => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      return registerWithEmail({ email, password, name })
        .then((tokens) => {
          setAccessToken(tokens.accessToken);
          setState((s) => ({
            ...s,
            status: 'authenticated',
            tokens,
            error: null,
            submitting: false,
          }));
        })
        .catch((e: unknown) => {
          const error = extractError(e);
          setState((s) => ({ ...s, error, submitting: false }));
          throw e;
        });
    },
    [],
  );

  // Вход через Telegram по кнопке. На маунте это делается автоматически, но
  // после logout (или упавшего автологина) пользователь остаётся на форме уже
  // ВНУТРИ Telegram — и ему нужен способ войти обратно, не вспоминая пароль.
  const loginViaTelegram = useCallback(() => {
    const initData = getWebApp()?.initData;
    if (!initData) {
      // Обычный браузер: initData взять неоткуда, войти можно только из Telegram.
      const error = 'Открой приложение из Telegram — там вход без пароля.';
      setState((s) => ({ ...s, error }));
      return Promise.reject(new Error(error));
    }

    setState((s) => ({ ...s, submitting: true, error: null }));
    return loginWithTelegram(initData)
      .then((tokens) => {
        setAccessToken(tokens.accessToken);
        setState((s) => ({
          ...s,
          status: 'authenticated',
          tokens,
          error: null,
          submitting: false,
        }));
      })
      .catch((e: unknown) => {
        const error = extractError(e);
        setState((s) => ({ ...s, error, submitting: false }));
        throw e;
      });
  }, []);

  // Форма гасит серверную ошибку сама: она относится к КОНКРЕТНОЙ прошлой
  // попытке и не должна висеть, когда пользователь уже правит поля или
  // переключил экран (иначе рядом с «Введи пароль» остаётся «Неверный email
  // или пароль» от предыдущего сабмита — два разных красных текста сразу).
  const clearError = useCallback(() => {
    setState((s) => (s.error === null ? s : { ...s, error: null }));
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setState({
      status: 'unauthenticated',
      tokens: null,
      error: null,
      submitting: false,
    });
  }, []);

  return { ...state, login, register, loginViaTelegram, clearError, logout };
}

function extractError(e: unknown): string {
  if (e instanceof ApiError) {
    // 429 от throttler отдаёт малоинформативное сообщение — поясняем причину.
    if (e.status === 429) return 'Слишком много попыток. Подожди минуту и попробуй снова.';
    return e.message;
  }
  return e instanceof Error ? e.message : 'Не удалось авторизоваться';
}
