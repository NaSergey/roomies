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
    throw new ApiError(res.status, extractMessage(parsed, res.status), parsed);
  }

  return parsed as T;
}

// ValidationPipe отдаёт message массивом («email must be an email», …) — склеиваем
// по-человечески, иначе String([...]) выводит их через запятую без пробелов.
function extractMessage(parsed: unknown, status: number): string {
  if (parsed && typeof parsed === 'object' && 'message' in parsed) {
    const raw = (parsed as { message: unknown }).message;
    if (Array.isArray(raw)) return raw.join('. ');
    if (typeof raw === 'string') return raw;
  }
  return `HTTP ${status}`;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
