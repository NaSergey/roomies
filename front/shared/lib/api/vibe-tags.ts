'use client';

import { apiFetch } from './client';

export type VibeTag = { id: number; label: string };

export function getVibeTags(): Promise<VibeTag[]> {
  return apiFetch<VibeTag[]>('/vibe-tags', { method: 'GET', auth: false });
}
