'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMatches,
  getChatMessages,
  sendMessage,
  proposeCall,
  respondCall,
  createAgreement,
  respondAgreement,
  markChatRead,
  getCallInvites,
  getAgreements,
} from '@/shared/lib/api';

// --- Query Keys ---

export const chatKeys = {
  matches: ['matches'] as const,
  messages: (chatId: number) => ['chat', chatId, 'messages'] as const,
  callInvites: (chatId: number) => ['chat', chatId, 'call-invites'] as const,
  agreements: (chatId: number) => ['chat', chatId, 'agreements'] as const,
};

// --- Queries ---

export function useMatchesQuery() {
  return useQuery({
    queryKey: chatKeys.matches,
    queryFn: getMatches,
    staleTime: 30_000,
  });
}

export function useChatMessagesQuery(chatId: number) {
  return useQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: () => getChatMessages(chatId),
    refetchInterval: 3000,
    staleTime: 0, // always considered stale so refetchInterval works consistently
  });
}

export function useCallInvitesQuery(chatId: number) {
  return useQuery({
    queryKey: chatKeys.callInvites(chatId),
    queryFn: () => getCallInvites(chatId),
    staleTime: 5000,
    refetchInterval: 5000,
  });
}

export function useAgreementsQuery(chatId: number) {
  return useQuery({
    queryKey: chatKeys.agreements(chatId),
    queryFn: () => getAgreements(chatId),
    staleTime: 10_000,
  });
}

// --- Mutations ---

export function useSendMessage(chatId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(chatId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
    },
  });
}

export function useProposeCall(chatId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposedTimes: string[]) => proposeCall(chatId, proposedTimes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.callInvites(chatId) });
    },
  });
}

export function useRespondCall(chatId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      inviteId,
      action,
      confirmedTime,
    }: {
      inviteId: number;
      action: 'accept' | 'decline';
      confirmedTime?: string;
    }) => respondCall(chatId, inviteId, action, confirmedTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.callInvites(chatId) });
    },
  });
}

export function useCreateAgreement(chatId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createAgreement(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.agreements(chatId) });
    },
  });
}

export function useRespondAgreement(chatId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agreementId,
      action,
    }: {
      agreementId: number;
      action: 'accept' | 'decline';
    }) => respondAgreement(chatId, agreementId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.agreements(chatId) });
    },
  });
}

export function useMarkChatRead(chatId: number) {
  return useMutation({
    mutationFn: () => markChatRead(chatId),
    // No onSuccess invalidation needed — read state is local
  });
}
