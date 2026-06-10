'use client';

import { apiFetch } from '@/shared/lib/api';
import type {
  OnboardingStatus,
  ScenarioType,
  LocationPayload,
  BudgetPayload,
  DealbreakersPayload,
  QuizPayload,
  ProfilePayload,
} from '../model/types';

export function getOnboardingStatus(): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>('/onboarding/status', { method: 'GET' });
}

export function saveScenario(scenario: ScenarioType): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/onboarding/scenario', {
    method: 'PATCH',
    body: { scenario },
  });
}

export function saveLocation(payload: LocationPayload): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/onboarding/location', {
    method: 'PATCH',
    body: payload,
  });
}

export function saveBudget(payload: BudgetPayload): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/onboarding/budget', {
    method: 'PATCH',
    body: payload,
  });
}

export function saveDealbreakers(
  payload: DealbreakersPayload,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/onboarding/dealbreakers', {
    method: 'PATCH',
    body: payload,
  });
}

export function saveQuiz(payload: QuizPayload): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/onboarding/quiz', {
    method: 'POST',
    body: payload,
  });
}

export function saveProfile(payload: ProfilePayload): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/onboarding/profile', {
    method: 'PATCH',
    body: payload,
  });
}
