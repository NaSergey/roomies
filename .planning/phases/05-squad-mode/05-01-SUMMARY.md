---
phase: 05-squad-mode
plan: "01"
subsystem: backend
tags: [squad, nestjs, crud, invite-flow, feed]
dependency_graph:
  requires: []
  provides:
    - "POST /squads — create squad, become leader"
    - "GET /squads/me — current user's active squad or null"
    - "POST /squads/:id/invites — invite a match (leader only)"
    - "GET /squads/invites/pending — pending invites for current user"
    - "PATCH /squads/invites/:inviteId/respond — accept or decline invite"
    - "DELETE /squads/:id/members/me — leave squad (leader deactivates)"
    - "GET /squads/feed — active squads in city, user not a member"
  affects:
    - "front/widgets/profile — Plans 05-02 (squad section)"
    - "front/widgets/swipe-deck — Plan 05-03 (squad feed cards)"
tech_stack:
  added: []
  patterns:
    - "assertLeader() ForbiddenException guard — mirrors assertParticipant() from ChatService"
    - "Prisma $transaction for multi-step mutations (createSquad, respondInvite accept)"
    - "Literal controller routes declared before parameterised :id routes to avoid NestJS shadowing"
    - "formatSquad() private helper for consistent squad card shape across endpoints"
key_files:
  created:
    - "roomies back/src/squad/squad.module.ts"
    - "roomies back/src/squad/squad.controller.ts"
    - "roomies back/src/squad/squad.service.ts"
    - "roomies back/src/squad/dto/create-squad.dto.ts"
    - "roomies back/src/squad/dto/invite-member.dto.ts"
    - "roomies back/src/squad/dto/respond-invite.dto.ts"
  modified:
    - "roomies back/src/app.module.ts"
decisions:
  - "Route ordering: getMySquad, getPendingInvites, getSquadFeed declared before any :id route — prevents NestJS treating literal strings 'me'/'invites'/'feed' as numeric :id segments"
  - "createSquad uses Prisma $transaction: create squad, then create SquadMember leader, then re-fetch with full includes — ensures the member count is 1 in the returned squad card"
  - "formatSquad() is a private helper returning a stable SquadCard shape used by createSquad, getMySquad, getSquadFeed — single source of truth"
  - "getSquadFeed applies in-memory filter (members.length < maxMembers) after DB query because Prisma where does not support comparing count of a relation to a model field directly"
metrics:
  duration: "~15 min"
  completed: "2026-06-23"
  tasks_completed: 3
  files_created: 6
  files_modified: 1
---

# Phase 5 Plan 01: SquadModule — 8 endpoints for squad CRUD, invite flow, and feed

**One-liner:** NestJS SquadModule with assertLeader guard, Prisma $transaction mutations, and city-filtered feed — all routes TypeScript-clean in a single build pass.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create 3 DTOs | 767563e | dto/create-squad.dto.ts, dto/invite-member.dto.ts, dto/respond-invite.dto.ts |
| 2 | Create SquadService | 767563e | squad.service.ts |
| 3 | Create SquadController, SquadModule; register in AppModule | 767563e | squad.controller.ts, squad.module.ts, app.module.ts |

## What Was Built

### SquadService — 7 public methods + 2 private helpers

- `createSquad(userId, dto)` — guards against already-in-active-squad; uses $transaction to create squad + SquadMember leader in one atomic step; re-fetches with full includes before returning formatted card
- `getMySquad(userId)` — returns null (not throws) when user has no active squad
- `inviteMember(squadId, senderId, recipientId)` — assertLeader → match check → capacity check → duplicate-invite check → create SquadInvite
- `getPendingInvites(userId)` — returns compact invite list with squadName and memberCount
- `respondInvite(inviteId, userId, action)` — ownership guard; decline path is single update; accept path uses $transaction (create SquadMember + update invite)
- `leaveSquad(squadId, userId)` — leader leaving: sets squad.isActive=false; member leaving: deletes SquadMember row
- `getSquadFeed(userId)` — city-filtered (when cityId set), take:20, in-memory filter for member capacity
- `private assertLeader` — ForbiddenException if not member or not leader role
- `private formatSquad` — stable card shape: id, name, memberCount, maxMembers, budgetMin, budgetMax, districts[], members[]

### SquadController — 7 route handlers

Routes in declaration order (literal paths before parameterised):
1. `GET squads/me` — getMySquad
2. `GET squads/invites/pending` — getPendingInvites
3. `GET squads/feed` — getSquadFeed
4. `POST squads` — createSquad (201)
5. `POST squads/:id/invites` — inviteMember (201)
6. `PATCH squads/invites/:inviteId/respond` — respondInvite
7. `DELETE squads/:id/members/me` — leaveSquad (204)

All handlers: @UseGuards(JwtAuthGuard) + @ApiBearerAuth()

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Status | Implementation |
|-----------|--------|----------------|
| T-05-01 | Mitigated | assertLeader() throws 403 before inviteMember |
| T-05-02 | Mitigated | respondInvite() checks invite.recipientId === userId throws 403 |
| T-05-03 | Mitigated | @IsIn(['accept', 'decline']) on RespondInviteDto |
| T-05-04 | Mitigated | @IsInt() @IsPositive() on InviteMemberDto + service verifies recipientId is a real match |
| T-05-05 | Accepted | take: 20 hard limit in getSquadFeed |
| T-05-06 | Mitigated | createSquad queries squadMember where squad.isActive=true before creation |
| T-05-07 | Mitigated | Literal routes declared before parameterised :id routes in controller |

## Known Stubs

None — all endpoints return real Prisma data.

## Threat Flags

None — no new trust boundaries beyond what the plan's threat model covers.

## Self-Check: PASSED

- [x] `roomies back/src/squad/squad.service.ts` — exists
- [x] `roomies back/src/squad/squad.controller.ts` — exists
- [x] `roomies back/src/squad/squad.module.ts` — exists
- [x] `roomies back/src/squad/dto/create-squad.dto.ts` — exists
- [x] `roomies back/src/squad/dto/invite-member.dto.ts` — exists
- [x] `roomies back/src/squad/dto/respond-invite.dto.ts` — exists
- [x] `roomies back/src/app.module.ts` — SquadModule import + array entry confirmed (2 lines)
- [x] `npm run build` — exits 0, no TypeScript errors
- [x] Commit 767563e — verified in git log
