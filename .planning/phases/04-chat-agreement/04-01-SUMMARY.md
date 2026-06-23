---
phase: 04-chat-agreement
plan: "01"
subsystem: backend
tags: [chat, messaging, call-invite, roomie-agreement, nestjs]
dependency_graph:
  requires: []
  provides:
    - ChatModule with 11 REST endpoints
    - Chat auto-creation on mutual match via SwipeService
  affects:
    - roomies back/src/swipe/swipe.service.ts
    - roomies back/src/app.module.ts
tech_stack:
  added: []
  patterns:
    - NestJS module with AuthModule + PrismaModule imports
    - assertParticipant() guard pattern for chat access control
    - BigInt cursor pagination for messages
    - Prisma $transaction for atomic multi-entity creation
key_files:
  created:
    - roomies back/src/chat/chat.service.ts
    - roomies back/src/chat/chat.controller.ts
    - roomies back/src/chat/chat.module.ts
    - roomies back/src/chat/dto/create-message.dto.ts
    - roomies back/src/chat/dto/propose-call.dto.ts
    - roomies back/src/chat/dto/respond-call.dto.ts
    - roomies back/src/chat/dto/respond-agreement.dto.ts
  modified:
    - roomies back/src/swipe/swipe.service.ts
    - roomies back/src/app.module.ts
decisions:
  - "assertParticipant() is private, called at the start of every method that touches chat data"
  - "chat: { create: {} } is placed ONLY in the match upsert create block, not update"
  - "PrismaModule imported explicitly in ChatModule even though it is @Global(), per plan requirement"
  - "Message IDs returned as String() per BigInt serialization rule"
  - "AGREEMENT_ITEMS defined as module-level constant outside the class"
metrics:
  duration: "~20 minutes"
  completed: "2026-06-23"
  tasks_completed: 3
  files_created: 7
  files_modified: 2
---

# Phase 4 Plan 01: ChatModule — 11 Endpoints + SwipeService Auto-Creates Chat on Match Summary

**One-liner:** NestJS ChatModule with 11 REST endpoints for messaging, call invites, and Roomie Agreements, plus SwipeService extended to auto-create Chat on mutual match.

## What Was Built

### Task 1: 4 DTOs + SwipeService extension
- `CreateMessageDto`: `content: string` with `@IsString @IsNotEmpty @MaxLength(2000)`
- `ProposeCallDto`: `proposedTimes: string[]` with `@IsArray @ArrayMinSize(1) @ArrayMaxSize(3) @IsISO8601({}, {each:true})`
- `RespondCallDto`: `action: 'accept'|'decline'` + optional `confirmedTime: string` with ISO8601 validation
- `RespondAgreementDto`: `action: 'accept'|'decline'` with `@IsIn`
- `SwipeService`: added `chat: { create: {} }` to `tx.match.upsert` create block only (D-01 from context)

### Task 2: ChatService
11 methods implemented:
- `assertParticipant(chatId, userId)` — private guard, throws 403 ForbiddenException if user not in match.user1Id/user2Id
- `getMatches(userId)` — returns match list with partner info, last message, unread count, matchScore
- `getChatMessages(chatId, userId, limit, before?)` — cursor-based pagination with BigInt, newest first
- `sendMessage(chatId, userId, content)` — creates text Message, returns with id as String
- `proposeCall(chatId, userId, proposedTimes)` — creates CallInvite + call_invite Message in transaction
- `respondCall(chatId, userId, inviteId, action, confirmedTime?)` — accept/decline, validates pending status
- `createAgreement(chatId, userId)` — creates RoomieAgreement + 5 AgreementItems + system Message in transaction
- `respondAgreement(chatId, userId, agreementId, action)` — accept/decline, blocks self-respond (T-04-02)
- `markRead(chatId, userId)` — upserts ChatRead on composite PK
- `getCallInvites(chatId, userId)` — returns all call invites for chat
- `getAgreements(chatId, userId)` — returns agreements with items

AGREEMENT_ITEMS constant (5 standard items):
1. `quiet` — "Тишина после 23:00"
2. `cleaning` — "Уборка по очереди раз в неделю"
3. `guests` — "Гости предупреждают за сутки"
4. `utilities` — "Коммуналка делится поровну"
5. `shared_zones` — "Кухня и ванная — убираем за собой"

### Task 3: ChatController + ChatModule + AppModule registration
11 routes wired:
- `GET /matches` — match list
- `GET /chats/:chatId/messages` — paginated messages
- `POST /chats/:chatId/messages` — send message
- `POST /chats/:chatId/call-invites` — propose call (201)
- `PATCH /chats/:chatId/call-invites/:id` — respond to call
- `POST /chats/:chatId/agreements` — create agreement (201)
- `PATCH /chats/:chatId/agreements/:id/respond` — respond to agreement
- `PATCH /chats/:chatId/read` — mark read (204)
- `GET /chats/:chatId/call-invites` — list call invites
- `GET /chats/:chatId/agreements` — list agreements

All routes: `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

All STRIDE threats from plan's threat register are mitigated:
- T-04-01, T-04-02: `assertParticipant()` + self-respond check in `respondAgreement()`
- T-04-03: `@MaxLength(2000)` on CreateMessageDto
- T-04-04: `@IsISO8601({ each: true })` + `@ArrayMaxSize(3)` on ProposeCallDto
- T-04-05: `@IsIn(['accept', 'decline'])` on both respond DTOs
- T-04-06: `getMatches()` only returns matches where user is user1Id or user2Id
- T-04-07: Accepted — cursor BigInt parse error returns 500 (acceptable for MVP)

## Known Stubs

None — this plan is backend-only with no frontend UI stubs.

## Self-Check: PASSED

Files exist:
- roomies back/src/chat/chat.service.ts: FOUND
- roomies back/src/chat/chat.controller.ts: FOUND
- roomies back/src/chat/chat.module.ts: FOUND
- roomies back/src/chat/dto/create-message.dto.ts: FOUND
- roomies back/src/chat/dto/propose-call.dto.ts: FOUND
- roomies back/src/chat/dto/respond-call.dto.ts: FOUND
- roomies back/src/chat/dto/respond-agreement.dto.ts: FOUND

Build: GREEN (npm run build exits 0, no TypeScript errors)
SwipeService: `chat: { create: {} }` confirmed at line 59
AppModule: ChatModule imported and registered (2 grep hits)
