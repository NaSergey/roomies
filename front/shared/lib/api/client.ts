'use client';

import { API_BASE_URL } from './config';
import { getAccessToken, clearAccessToken } from './token-storage';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  { body, auth = true, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const finalHeaders = new Headers(headers);
  if (body !== undefined && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const parsed: unknown = text ? safeJson(text) : undefined;

  if (!res.ok) {
    // Стухший/битый токен: выкидываем его, чтобы следующий старт Mini App
    // перелогинился через initData, а не залипал в «authenticated» навсегда.
    if (res.status === 401 && auth) {
      clearAccessToken();
    }
    const message =
      (parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : undefined) ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, message, parsed);
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
