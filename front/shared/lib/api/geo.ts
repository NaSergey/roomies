'use client';

import { apiFetch } from './client';

export type City = { id: number; name: string; countryCode: string };
export type District = { id: number; cityId: number; name: string };

export function getCities(): Promise<City[]> {
  return apiFetch<City[]>('/geo/cities', { method: 'GET', auth: false });
}

export function getDistricts(cityId: number): Promise<District[]> {
  return apiFetch<District[]>(`/geo/cities/${cityId}/districts`, {
    method: 'GET',
    auth: false,
  });
}
