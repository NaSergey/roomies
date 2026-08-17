'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSquad,
  getMySquad,
  inviteToSquad,
  getPendingInvites,
  respondInvite,
  leaveSquad,
  getSquadFeed,
} from '@/shared/lib/api';

// --- Query Keys ---

export const squadKeys = {
  mySquad: ['squad', 'me'] as const,
  feed: ['squad', 'feed'] as const,
  pendingInvites: ['squad', 'invites', 'pending'] as const,
};

// --- Queries ---

// enabled — чтобы экран, на котором squad-блок скрыт флагом, не тянул данные
// «в стол»: ProfileView держит SHOW_SQUAD = false, но оба запроса уходили на
// каждый вход в профиль и их результат никуда не рендерился.
export function useMySquadQuery(enabled = true) {
  return useQuery({
    queryKey: squadKeys.mySquad,
    queryFn: getMySquad,
    staleTime: 30_000,
    enabled,
  });
}

export function useSquadFeedQuery() {
  return useQuery({
    queryKey: squadKeys.feed,
    queryFn: getSquadFeed,
    staleTime: 60_000,
  });
}

export function usePendingInvitesQuery(enabled = true) {
  return useQuery({
    queryKey: squadKeys.pendingInvites,
    queryFn: getPendingInvites,
    staleTime: 30_000,
    enabled,
  });
}

// --- Mutations ---

export function useCreateSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createSquad>[0]) => createSquad(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: squadKeys.mySquad });
    },
  });
}

export function useInviteToSquad(squadId: number) {
  return useMutation({
    mutationFn: (recipientId: number) => inviteToSquad(squadId, recipientId),
  });
}

export function useRespondInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      inviteId,
      action,
    }: {
      inviteId: number;
      action: 'accept' | 'decline';
    }) => respondInvite(inviteId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: squadKeys.mySquad });
      queryClient.invalidateQueries({ queryKey: squadKeys.pendingInvites });
    },
  });
}

export function useLeaveSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (squadId: number) => leaveSquad(squadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: squadKeys.mySquad });
    },
  });
}
