'use client';

import { apiFetch, ApiError } from './client';

// --- Interfaces ---

export interface SquadData {
  id: number;
  name: string | null;
  memberCount: number;
  maxMembers: number;
  budgetMin: number | null;
  budgetMax: number | null;
  districts: { id: number; name: string }[];
  members: { id: number; name: string; photo: string | null; role?: string }[];
}

export interface SquadInvite {
  id: number;
  squadId: number;
  squadName: string | null;
  memberCount: number;
  senderId: number;
  senderName: string;
}

export interface SquadFeedCard {
  id: number;
  name: string | null;
  memberCount: number;
  maxMembers: number;
  budgetMin: number | null;
  budgetMax: number | null;
  districts: { id: number; name: string }[];
  members: { id: number; name: string; photo: string | null }[];
}

// --- API Functions ---

export function createSquad(data: {
  name?: string;
  budgetMin?: number;
  budgetMax?: number;
  districtIds?: number[];
  cityId?: number;
}): Promise<SquadData> {
  return apiFetch<SquadData>('/squads', { method: 'POST', body: data });
}

export async function getMySquad(): Promise<SquadData | null> {
  try {
    return (await apiFetch<SquadData | null>('/squads/me', { method: 'GET' })) ?? null;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function inviteToSquad(
  squadId: number,
  recipientId: number,
): Promise<void> {
  return apiFetch<void>('/squads/' + squadId + '/invites', {
    method: 'POST',
    body: { recipientId },
  });
}

export function getPendingInvites(): Promise<SquadInvite[]> {
  return apiFetch<SquadInvite[]>('/squads/invites/pending', { method: 'GET' });
}

export function respondInvite(
  inviteId: number,
  action: 'accept' | 'decline',
): Promise<void> {
  return apiFetch<void>('/squads/invites/' + inviteId + '/respond', {
    method: 'PATCH',
    body: { action },
  });
}

export function leaveSquad(squadId: number): Promise<void> {
  return apiFetch<void>('/squads/' + squadId + '/members/me', {
    method: 'DELETE',
  });
}

export function getSquadFeed(): Promise<SquadFeedCard[]> {
  return apiFetch<SquadFeedCard[]>('/squads/feed', { method: 'GET' });
}
