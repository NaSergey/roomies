'use client';

import { apiFetch } from './client';

// --- Interfaces ---

export interface MatchListItem {
  matchId: number;
  chatId: number;
  partner: { id: number; name: string; photo: string | null };
  lastMessage: {
    content: string | null;
    createdAt: string;
    senderId: number;
    messageType: string;
  } | null;
  unreadCount: number;
  matchScore: number;
}

export interface ChatMessage {
  id: string; // BigInt serialized as string by backend (main.ts BigInt.toJSON patch)
  chatId: number;
  senderId: number;
  content: string | null;
  messageType: 'text' | 'system' | 'call_invite';
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface MessagesPage {
  messages: ChatMessage[];
  nextCursor: string | null;
}

export interface CallInviteData {
  id: number;
  chatId: number;
  proposerId: number;
  proposedTimes: string[];
  confirmedTime: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface AgreementItem {
  id: number;
  category: string;
  ruleText: string;
  agreed: boolean;
}

export interface AgreementData {
  id: number;
  chatId: number;
  status: 'draft' | 'accepted' | 'declined';
  createdById: number;
  createdAt: string;
  acceptedAt: string | null;
  items: AgreementItem[];
}

// --- API Functions ---

export function getMatches(): Promise<MatchListItem[]> {
  return apiFetch<MatchListItem[]>('/matches', { method: 'GET' });
}

export function getChatMessages(
  chatId: number,
  cursor?: string,
): Promise<MessagesPage> {
  const qs = new URLSearchParams({ limit: '30' });
  if (cursor) qs.set('before', cursor);
  return apiFetch<MessagesPage>(
    '/chats/' + chatId + '/messages?' + qs.toString(),
    { method: 'GET' },
  );
}

export function sendMessage(
  chatId: number,
  content: string,
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>('/chats/' + chatId + '/messages', {
    method: 'POST',
    body: { content },
  });
}

export function proposeCall(
  chatId: number,
  proposedTimes: string[],
): Promise<CallInviteData> {
  return apiFetch<CallInviteData>('/chats/' + chatId + '/call-invites', {
    method: 'POST',
    body: { proposedTimes },
  });
}

export function respondCall(
  chatId: number,
  inviteId: number,
  action: 'accept' | 'decline',
  confirmedTime?: string,
): Promise<CallInviteData> {
  return apiFetch<CallInviteData>(
    '/chats/' + chatId + '/call-invites/' + inviteId,
    {
      method: 'PATCH',
      body: { action, ...(confirmedTime ? { confirmedTime } : {}) },
    },
  );
}

export function createAgreement(chatId: number): Promise<AgreementData> {
  return apiFetch<AgreementData>('/chats/' + chatId + '/agreements', {
    method: 'POST',
  });
}

export function respondAgreement(
  chatId: number,
  agreementId: number,
  action: 'accept' | 'decline',
): Promise<AgreementData> {
  return apiFetch<AgreementData>(
    '/chats/' + chatId + '/agreements/' + agreementId + '/respond',
    {
      method: 'PATCH',
      body: { action },
    },
  );
}

export function markChatRead(chatId: number): Promise<void> {
  return apiFetch<void>('/chats/' + chatId + '/read', { method: 'PATCH' });
}

export function getCallInvites(chatId: number): Promise<CallInviteData[]> {
  return apiFetch<CallInviteData[]>('/chats/' + chatId + '/call-invites', {
    method: 'GET',
  });
}

export function getAgreements(chatId: number): Promise<AgreementData[]> {
  return apiFetch<AgreementData[]>('/chats/' + chatId + '/agreements', {
    method: 'GET',
  });
}
