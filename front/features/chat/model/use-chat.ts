'use client';

import { useEffect } from 'react';
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

// Сколько переписок греем из списка мэтчей. Открывают почти всегда одну из
// верхних, а тянуть все разом — это N запросов на вход во вкладку.
const PREFETCH_CHATS = 8;

/** Греет сообщения верхних чатов, пока пользователь смотрит список мэтчей.
 *  Без этого тап по мэтчу открывал пустую переписку, и сообщения въезжали
 *  уже после того, как экран сменился. */
export function usePrefetchChats(chatIds: number[]) {
  const queryClient = useQueryClient();
  // Строкой, а не массивом: у эффекта должна быть стабильная зависимость,
  // иначе новый массив на каждый рендер перезапускал бы прогрев.
  const key = chatIds.slice(0, PREFETCH_CHATS).join(',');

  useEffect(() => {
    if (!key) return;
    for (const id of key.split(',').map(Number)) {
      void queryClient.prefetchQuery({
        queryKey: chatKeys.messages(id),
        queryFn: () => getChatMessages(id),
        staleTime: 3000, // столько же живёт refetchInterval самой переписки
      });
    }
  }, [key, queryClient]);
}

export function useChatMessagesQuery(chatId: number) {
  return useQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: () => getChatMessages(chatId),
    refetchInterval: 3000,
    staleTime: 0, // always considered stale so refetchInterval works consistently
  });
}

// chatId = 0 означает «чат не выбран» (ChatView зовёт хуки безусловно, чтобы не
// нарушать порядок хуков). Без enabled такой запрос реально уходил на сервер и
// падал с 403 — а у приглашений ещё и refetchInterval, так что пока открыт
// список мэтчей, раз в 5 секунд уходил заведомо неудачный запрос.
export function useCallInvitesQuery(chatId: number) {
  return useQuery({
    queryKey: chatKeys.callInvites(chatId),
    queryFn: () => getCallInvites(chatId),
    staleTime: 5000,
    refetchInterval: 5000,
    enabled: chatId > 0,
  });
}

export function useAgreementsQuery(chatId: number) {
  return useQuery({
    queryKey: chatKeys.agreements(chatId),
    queryFn: () => getAgreements(chatId),
    staleTime: 10_000,
    enabled: chatId > 0,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markChatRead(chatId),
    // unreadCount живёт в списке мэтчей и считается на сервере (chat.service
    // listMatches), а не локально. Без инвалидации бейдж непрочитанных висел на
    // карточке чата, который только что открыли, до истечения staleTime списка
    // (30 секунд) — вышел из переписки и видишь счётчик у прочитанного.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.matches });
    },
  });
}
