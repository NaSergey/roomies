---
phase: 04-chat-agreement
plan: "02"
subsystem: frontend
tags: [chat, api-layer, react-query, typescript, frontend]
dependency_graph:
  requires:
    - 04-01 (ChatModule backend — 11 REST endpoints)
  provides:
    - front/shared/lib/api/chat.ts — all chat types and API functions
    - front/features/chat/model/use-chat.ts — all React Query hooks
    - front/features/chat/index.ts — feature barrel
  affects:
    - front/shared/lib/api/index.ts
tech_stack:
  added: []
  patterns:
    - apiFetch from shared/lib/api/client.ts for all HTTP calls (auth token included)
    - React Query useQuery with refetchInterval for polling (D-02: 3s for messages)
    - chatKeys query key factory for cache management and invalidation
    - useMutation with onSuccess cache invalidation via useQueryClient
    - FSD: features/chat imports only from shared/ (no widgets/views imports)
key_files:
  created:
    - front/shared/lib/api/chat.ts
    - front/features/chat/model/use-chat.ts
    - front/features/chat/index.ts
  modified:
    - front/shared/lib/api/index.ts
decisions:
  - "ChatMessage.id typed as string (BigInt serialized by backend main.ts BigInt.toJSON patch)"
  - "useChatMessagesQuery uses staleTime: 0 + refetchInterval: 3000 so polling always fires"
  - "useMarkChatRead has no onSuccess invalidation — read state is UI-local"
  - "Barrel index.ts uses named exports (not export *) for IDE discoverability"
metrics:
  duration: "~2 minutes"
  completed: "2026-06-23"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 4 Plan 02: Frontend Chat API Layer + React Query Hooks Summary

**One-liner:** TypeScript API contract layer (10 functions, 6 interfaces) and React Query hook set (10 hooks) for all chat, call-invite, and agreement endpoints, with 3-second polling for message updates.

## What Was Built

### Task 1: front/shared/lib/api/chat.ts + index.ts barrel update

**6 TypeScript interfaces:**
- `MatchListItem` — match list row: matchId, chatId, partner {id, name, photo}, lastMessage, unreadCount, matchScore
- `ChatMessage` — message: `id: string` (BigInt serialized), chatId, senderId, content, messageType ('text'|'system'|'call_invite'), metadata, createdAt
- `MessagesPage` — paginated messages: messages[], nextCursor string|null
- `CallInviteData` — call invite: id, chatId, proposerId, proposedTimes string[], confirmedTime, status enum
- `AgreementItem` — single agreement item: id, category, ruleText, agreed
- `AgreementData` — full agreement: id, chatId, status enum, createdById, createdAt, acceptedAt, items[]

**10 API functions:**
- `getMatches()` — GET /matches → MatchListItem[]
- `getChatMessages(chatId, cursor?)` — GET /chats/:id/messages?limit=30&before=<cursor> → MessagesPage
- `sendMessage(chatId, content)` — POST /chats/:id/messages → ChatMessage
- `proposeCall(chatId, proposedTimes)` — POST /chats/:id/call-invites → CallInviteData
- `respondCall(chatId, inviteId, action, confirmedTime?)` — PATCH /chats/:id/call-invites/:id → CallInviteData
- `createAgreement(chatId)` — POST /chats/:id/agreements → AgreementData
- `respondAgreement(chatId, agreementId, action)` — PATCH /chats/:id/agreements/:id/respond → AgreementData
- `markChatRead(chatId)` — PATCH /chats/:id/read → void
- `getCallInvites(chatId)` — GET /chats/:id/call-invites → CallInviteData[]
- `getAgreements(chatId)` — GET /chats/:id/agreements → AgreementData[]

Updated `front/shared/lib/api/index.ts` with named chat exports at the bottom.

### Task 2: front/features/chat/model/use-chat.ts + front/features/chat/index.ts

**chatKeys factory:**
```typescript
chatKeys.matches           // ['matches']
chatKeys.messages(chatId)  // ['chat', chatId, 'messages']
chatKeys.callInvites(chatId)
chatKeys.agreements(chatId)
```

**4 queries:**
- `useMatchesQuery()` — staleTime: 30_000ms
- `useChatMessagesQuery(chatId)` — refetchInterval: 3000ms, staleTime: 0 (D-02 HTTP polling)
- `useCallInvitesQuery(chatId)` — refetchInterval: 5000ms, staleTime: 5000ms
- `useAgreementsQuery(chatId)` — staleTime: 10_000ms

**6 mutations with cache invalidation:**
- `useSendMessage(chatId)` — invalidates messages
- `useProposeCall(chatId)` — invalidates messages + callInvites
- `useRespondCall(chatId)` — invalidates messages + callInvites
- `useCreateAgreement(chatId)` — invalidates messages + agreements
- `useRespondAgreement(chatId)` — invalidates messages + agreements
- `useMarkChatRead(chatId)` — no invalidation (read state is local)

**Feature barrel** `front/features/chat/index.ts` re-exports all 10 hooks, chatKeys, and 6 types from @/shared/lib/api.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

- T-04-09: `action: 'accept' | 'decline'` TypeScript union enforced at compile time in `respondCall` and `respondAgreement` — prevents invalid values being sent to backend
- T-04-10: `ChatMessage.id` typed as `string` — BigInt serialized by backend; frontend treats as opaque cursor string, no arithmetic performed
- T-04-SC: No new packages installed — @tanstack/react-query was already present

## Known Stubs

None — this plan creates pure data-layer code with no UI components or rendered output.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. All HTTP calls route through existing `apiFetch` with auth=true (Bearer token included by default).

## Self-Check: PASSED

Files exist:
- front/shared/lib/api/chat.ts: FOUND (10 exported functions, 6 exported interfaces)
- front/features/chat/model/use-chat.ts: FOUND (10 exported hooks + chatKeys)
- front/features/chat/index.ts: FOUND (barrel re-exports all hooks + types)
- front/shared/lib/api/index.ts: FOUND (chat exports at bottom, line 36)

TypeScript: `npx tsc --noEmit` exits clean (no output = no errors), verified twice (after task 1, after task 2).

Commits:
- 1d39b72: feat(04-02): chat API types and functions in shared/lib/api/chat.ts
- a848516: feat(04-02): React Query hooks for chat feature (use-chat.ts + barrel)
