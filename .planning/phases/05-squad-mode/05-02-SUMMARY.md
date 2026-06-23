---
phase: 05-squad-mode
plan: "02"
subsystem: frontend
tags: [squad, react-query, api-layer, typescript]
dependency_graph:
  requires:
    - "05-01 — SquadModule 7 REST endpoints (GET /squads/me, POST /squads, etc.)"
  provides:
    - "front/shared/lib/api/squad.ts — SquadData, SquadInvite, SquadFeedCard types + 7 apiFetch wrappers"
    - "front/features/squad/model/use-squad.ts — useMySquadQuery, useSquadFeedQuery, usePendingInvitesQuery, useCreateSquad, useInviteToSquad, useRespondInvite, useLeaveSquad"
    - "front/features/squad/index.ts — FSD barrel for squad feature"
  affects:
    - "front/widgets/profile — Plan 05-03 imports useMySquadQuery, usePendingInvitesQuery, useCreateSquad, useInviteToSquad, useRespondInvite, useLeaveSquad"
    - "front/widgets/swipe-deck — Plan 05-03 imports useSquadFeedQuery, SquadFeedCard"
tech_stack:
  added: []
  patterns:
    - "getMySquad() 404-to-null conversion using ApiError instanceof check — matches backend null-on-no-squad contract"
    - "squadKeys query key factory — typed const arrays for cache invalidation"
    - "useRespondInvite double invalidation — invalidates both mySquad and pendingInvites on accept/decline"
    - "FSD feature barrel — index.ts re-exports hooks from model/ and types from shared/lib/api via @/shared/lib/api"
key_files:
  created:
    - "front/shared/lib/api/squad.ts"
    - "front/features/squad/model/use-squad.ts"
    - "front/features/squad/index.ts"
  modified:
    - "front/shared/lib/api/index.ts"
decisions:
  - "getMySquad wraps apiFetch in try/catch and returns null on ApiError(404) — backend intentionally returns 404 (not 200+null) when user has no active squad"
  - "useSquadFeedQuery staleTime: 60_000 — squads change infrequently; 60s cache avoids hammering feed endpoint on every render"
  - "useRespondInvite invalidates both squadKeys.mySquad and squadKeys.pendingInvites — accepting puts user into a squad (mySquad must refresh) and removes the invite (pendingInvites must refresh)"
  - "SquadFeedCard is a separate interface from SquadData — feed cards omit member.role and are a read-only snapshot; keeping them separate avoids future drift"
metrics:
  duration: "~10 min"
  completed: "2026-06-23"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 5 Plan 02: Frontend Squad API Layer + React Query Hooks

**One-liner:** TypeScript API module with 404-to-null guard and 7 React Query hooks (3 queries, 4 mutations) wired to the SquadModule REST endpoints.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create squad.ts API module + update shared barrel | 097c291 | front/shared/lib/api/squad.ts, front/shared/lib/api/index.ts |
| 2 | Create use-squad.ts hooks + features/squad barrel | 993ed35 | front/features/squad/model/use-squad.ts, front/features/squad/index.ts |

## What Was Built

### front/shared/lib/api/squad.ts — 3 interfaces + 7 functions

**Interfaces:**
- `SquadData` — full squad card: id, name, memberCount, maxMembers, budgetMin, budgetMax, districts[], members[] (with optional role)
- `SquadInvite` — compact invite: id, squadId, squadName, memberCount, senderId, senderName
- `SquadFeedCard` — read-only feed card: same shape as SquadData but members have no role field

**Functions:**
- `createSquad(data)` — POST /squads, returns SquadData
- `getMySquad()` — GET /squads/me, returns SquadData | null (catches 404, re-throws others)
- `inviteToSquad(squadId, recipientId)` — POST /squads/:id/invites
- `getPendingInvites()` — GET /squads/invites/pending, returns SquadInvite[]
- `respondInvite(inviteId, action)` — PATCH /squads/invites/:id/respond
- `leaveSquad(squadId)` — DELETE /squads/:id/members/me
- `getSquadFeed()` — GET /squads/feed, returns SquadFeedCard[]

### front/features/squad/model/use-squad.ts — 7 hooks

**Queries (useQuery):**
- `useMySquadQuery()` — staleTime: 30_000, returns UseQueryResult<SquadData | null>
- `useSquadFeedQuery()` — staleTime: 60_000, returns UseQueryResult<SquadFeedCard[]>
- `usePendingInvitesQuery()` — staleTime: 30_000, returns UseQueryResult<SquadInvite[]>

**Mutations (useMutation):**
- `useCreateSquad()` — invalidates squadKeys.mySquad on success
- `useInviteToSquad(squadId)` — no invalidation (invite list is recipient-side)
- `useRespondInvite()` — invalidates squadKeys.mySquad AND squadKeys.pendingInvites on success
- `useLeaveSquad()` — invalidates squadKeys.mySquad on success

### front/features/squad/index.ts — FSD barrel

Re-exports all 7 hooks + squadKeys from ./model/use-squad, and re-exports SquadData, SquadInvite, SquadFeedCard types from @/shared/lib/api (following the same pattern as features/chat/index.ts).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all API functions target real backend endpoints from Plan 05-01.

## Threat Flags

None — no new trust boundaries. All API calls use the existing authenticated apiFetch client.

## Self-Check: PASSED

- [x] `front/shared/lib/api/squad.ts` — exists (3 interfaces + 7 exported functions)
- [x] `front/features/squad/model/use-squad.ts` — exists (7 exported hook functions)
- [x] `front/features/squad/index.ts` — exists (barrel)
- [x] `front/shared/lib/api/index.ts` — contains squad re-export block
- [x] Commit 097c291 — verified in git log
- [x] Commit 993ed35 — verified in git log
- [x] `npx tsc --noEmit` — exits 0, no errors
- [x] Hook count: grep returns 7
- [x] ApiError 404 guard confirmed at squad.ts:54
