'use client';

import { apiFetch } from './client';

export type FeedbackCategory = 'bug' | 'idea' | 'other';

export interface CreateFeedbackPayload {
  category: FeedbackCategory;
  message: string;
  /** С какого экрана написали — без этого «не работает» нечем локализовать. */
  screen?: string;
}

export interface FeedbackItem {
  id: number;
  category: FeedbackCategory;
  message: string;
  handled: boolean;
  createdAt: string;
}

export function sendFeedback(payload: CreateFeedbackPayload): Promise<{ id: number; createdAt: string }> {
  return apiFetch('/feedback', { method: 'POST', body: payload });
}

export function getMyFeedback(): Promise<FeedbackItem[]> {
  return apiFetch('/feedback/me', { method: 'GET' });
}
