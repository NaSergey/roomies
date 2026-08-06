'use client';

import { API_BASE_URL } from './config';
import { getAccessToken } from './token-storage';
import { ApiError } from './client';

// Multipart-загрузка не проходит через apiFetch: тот всегда JSON.stringify'ит body
// и ставит Content-Type: application/json, что ломает FormData.
export async function uploadPhoto(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);

  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}/profile/photo`, {
    method: 'POST',
    headers,
    body: form,
  });

  const text = await res.text();
  const parsed: unknown = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : undefined) ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, message, parsed);
  }

  return parsed as { url: string };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
