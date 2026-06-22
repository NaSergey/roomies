'use client';

import { apiFetch } from './client';

export interface FeedQueryParams {
  budgetMin?: number;
  budgetMax?: number;
  districtIds?: number[];
  smokingOk?: boolean;
  petsOk?: boolean;
  guestsPref?: 'rarely' | 'sometimes' | 'often';
}

export interface FeedCandidate {
  id: number;
  name: string;
  age?: number;
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
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: 'rarely' | 'sometimes' | 'often';
  matchReasons: string[];
  matchRisks?: string[];
}

export interface SwipeResult {
  matched: boolean;
  matchId?: number;
}

export function getFeed(params?: FeedQueryParams): Promise<FeedCandidate[]> {
  const qs = new URLSearchParams();
  if (params) {
    if (params.budgetMin !== undefined) qs.set('budgetMin', String(params.budgetMin));
    if (params.budgetMax !== undefined) qs.set('budgetMax', String(params.budgetMax));
    if (params.smokingOk !== undefined) qs.set('smokingOk', String(params.smokingOk));
    if (params.petsOk !== undefined) qs.set('petsOk', String(params.petsOk));
    if (params.guestsPref !== undefined) qs.set('guestsPref', params.guestsPref);
    if (params.districtIds) {
      params.districtIds.forEach((id) => qs.append('districtIds[]', String(id)));
    }
  }
  const query = qs.toString();
  return apiFetch<FeedCandidate[]>(query ? `/feed?${query}` : '/feed', { method: 'GET' });
}

export function postSwipe(
  targetId: number,
  action: 'like' | 'pass' | 'super_like' | 'save',
): Promise<SwipeResult> {
  return apiFetch<SwipeResult>('/swipes', {
    method: 'POST',
    body: { targetId, action },
  });
}
