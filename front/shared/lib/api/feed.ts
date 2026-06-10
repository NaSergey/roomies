'use client';

import { apiFetch } from './client';

export interface FeedCandidate {
  id: number;
  name: string;
  scenario: string;
  budgetMin: number | null;
  budgetMax: number | null;
  photos: string[];
  vibeTags: { id: number; label: string }[];
  districts: { id: number; name: string }[];
  lifestyleScales: {
    noiseLevel: number | null;
    cleanliness: number | null;
    sleepSchedule: number | null;
    socialLevel: number | null;
    workFromHome: number | null;
  };
  matchScore: number;
}

export interface SwipeResult {
  matched: boolean;
  matchId?: number;
}

export function getFeed(): Promise<FeedCandidate[]> {
  return apiFetch<FeedCandidate[]>('/feed', { method: 'GET' });
}

export function postSwipe(
  targetId: number,
  action: 'like' | 'pass' | 'super_like',
): Promise<SwipeResult> {
  return apiFetch<SwipeResult>('/swipes', {
    method: 'POST',
    body: { targetId, action },
  });
}
