'use client';

import { apiFetch } from './client';

export interface MyProfile {
  id: number;
  name: string;
  age?: number;
  scenario: string;
  budgetMin: number | null;
  budgetMax: number | null;
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: 'rarely' | 'sometimes' | 'often';
  photos: string[];
  vibeTags: { id: number; label: string }[];
  districts: { id: number; name: string }[];
  lifestyleScales: {
    noiseLevel: number | null;
    cleanliness: number | null;
    sleepSchedule: number | null;
    socialLevel: number | null;
    workFromHome: number | null;
  } | null;
  roomieScore: number;
  quizCompleted: boolean;
  onboardingStep: number;
  /** Код для реферальной ссылки (publicId аккаунта). */
  referralCode: string;
  /** Сколько человек зарегистрировалось по ссылке этого пользователя. */
  invitedCount: number;
}

export interface UpdateProfilePayload {
  name?: string;
  photoUrls?: string[];
  vibeTagIds?: number[];
  budgetMin?: number;
  budgetMax?: number;
  districtIds?: number[];
  smokingOk?: boolean;
  petsOk?: boolean;
  guestsPref?: 'rarely' | 'sometimes' | 'often';
}

export function getMe(): Promise<MyProfile> {
  return apiFetch<MyProfile>('/profile/me', { method: 'GET' });
}

export function patchProfile(dto: UpdateProfilePayload): Promise<MyProfile> {
  return apiFetch<MyProfile>('/profile', { method: 'PATCH', body: dto });
}
