---
phase: 02-matching-engine
plan: "02-02"
subsystem: backend/matching
tags: [feed, swipe, matching, nestjs, scoring]
dependency_graph:
  requires: [02-01 fake-profiles seed, Phase 1 auth (JwtAuthGuard, CurrentUser)]
  provides: [GET /feed endpoint, POST /swipes endpoint, Match record creation on mutual like]
  affects: [02-03 frontend wiring — SwipeDeck now has real endpoints to call]
tech_stack:
  added: []
  patterns:
    - NestJS Module pattern with AuthModule import for JwtAuthGuard
    - On-the-fly lifestyle proximity scoring (no pre-computation)
    - Scenario compatibility map (exhaustive enum keys)
    - Hard-conflict filter before scoring
    - Match invariant enforcement via Math.min/Math.max
key_files:
  created:
    - roomies back/src/feed/feed.service.ts
    - roomies back/src/feed/feed.controller.ts
    - roomies back/src/feed/feed.module.ts
    - roomies back/src/swipe/swipe.service.ts
    - roomies back/src/swipe/swipe.controller.ts
    - roomies back/src/swipe/swipe.module.ts
    - roomies back/src/swipe/dto/create-swipe.dto.ts
  modified:
    - roomies back/src/app.module.ts
decisions:
  - "FeedModule and SwipeModule import AuthModule (not global) to get JwtAuthGuard — same pattern as OnboardingModule"
  - "PrismaModule is @Global() so no explicit import needed in FeedModule or SwipeModule"
  - "Scenario compat map uses exhaustive Record<ScenarioType, ScenarioType[]> — TypeScript enforces all keys present"
  - "smokingOk=false means no smoking required; conflict only when one side is strict (false) and other is permissive (true)"
  - "matchScore in Match record set to 0.5 placeholder — real score lives in GET /feed response (computed on-the-fly)"
metrics:
  duration: 20m
  completed_date: "2026-06-10"
  tasks_completed: 2
  files_modified: 8
---

# Phase 2 Plan 2: FeedModule + SwipeModule Summary

**One-liner:** Built GET /feed with lifestyle proximity scoring + scenario compat filtering and POST /swipes with mutual-like Match creation (user1Id < user2Id enforced), both protected by JwtAuthGuard.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | FeedModule — FeedService + FeedController | fd0e5b8 | feed.service.ts, feed.controller.ts, feed.module.ts |
| 2 | SwipeModule + AppModule registration | 44c7af9 | swipe.service.ts, swipe.controller.ts, swipe.module.ts, dto/create-swipe.dto.ts, app.module.ts |

## What Was Built

### FeedService (`feed.service.ts`)

`getFeed(userId)` implements a 7-step pipeline:

1. Load current user's profile fields (cityId, scenario, budget, dealbreakers, lifestyle scales)
2. Fetch already-swiped target IDs to exclude
3. Resolve compatible scenarios via an exhaustive `Record<ScenarioType, ScenarioType[]>` map — `squad` maps exclusively to `['squad']`, housing scenarios cross-match each other
4. Query up to 100 candidates: same city, compatible scenario, `onboardingCompleted=true`, `isActive=true`, not self, not already swiped
5. Hard-conflict filter: budget non-overlap, smoking mismatch, pets mismatch — candidates failing any hard check are excluded entirely
6. Lifestyle score: `1 - avg(|me.scale - candidate.scale|)` across 5 scales (neutral 0.5 if no shared non-null scales)
7. Sort descending by matchScore, take top 20, map to response with lifestyleScales breakdown

### SwipeService (`swipe.service.ts`)

`createSwipe(actorId, dto)` pipeline:

1. Self-swipe guard → `BadRequestException`
2. Duplicate swipe check → `409 ConflictException` (DB unique constraint is secondary defense)
3. Create `Swipe` row with action
4. Mutual like check: if `like` or `super_like`, look for reverse swipe with same action types — if found, create `Match` record with `user1Id = Math.min(actorId, targetId)` and `user2Id = Math.max(actorId, targetId)` (invariant enforced)
5. Return `{ matched: true, matchId }` or `{ matched: false }`

### AppModule

`FeedModule` and `SwipeModule` added to imports array. Both modules follow the same pattern as `OnboardingModule` (import `AuthModule` explicitly since it is not `@Global()`).

## Verification Results

- `npx tsc --noEmit` in `roomies back/`: exits 0, no TypeScript errors
- `npm run build` in `roomies back/`: exits 0, clean NestJS build
- All acceptance criteria checks passed:
  - `UseGuards(JwtAuthGuard)` present in both controllers
  - `hasHardConflict` and `computeLifestyleScore` present in FeedService
  - Squad mapped exclusively to `['squad']` in scenario compat map
  - `Math.min` / `Math.max` in SwipeService (user1Id < user2Id invariant)
  - `ConflictException` in SwipeService (409 on duplicate)
  - `FeedModule` and `SwipeModule` in AppModule imports array

## Deviations from Plan

**1. [Rule 2 - Missing functionality] FeedModule imports AuthModule instead of PrismaModule**

- **Found during:** Task 1 implementation
- **Issue:** Plan said "Import PrismaModule from '../prisma/prisma.module'" but `PrismaModule` is `@Global()` — importing it is unnecessary. `OnboardingModule` (the canonical reference) imports `AuthModule` to get `JwtAuthGuard`; without `AuthModule`, the guard cannot be injected.
- **Fix:** Imported `AuthModule` in both `FeedModule` and `SwipeModule` (same pattern as `OnboardingModule`). Build confirmed clean.
- **Files modified:** feed.module.ts, swipe.module.ts

## Known Stubs

- `matchScore` in the `Match` record is stored as `0.5` placeholder — the real score is computed by `FeedService` on-the-fly and returned in the GET /feed response. The Match row is for the mutual-like relationship record. Phase 3 will pre-compute and store real scores.
- `lifestyleScore`, `vibeScore`, `behavioralScore` on `Match` record are `null` — per CONTEXT.md deferred decisions. Architecture in place; values populated in Phase 3.

## Threat Surface Review

| Mitigation | Status |
|------------|--------|
| T-02-02-01: actorId from JWT not body | Implemented — `@CurrentUser()` extracts from verified token |
| T-02-02-02: Match user1Id/user2Id ordering | Implemented — `Math.min/Math.max` before every `match.create` |
| T-02-02-03: /feed returns minimal fields only | Implemented — no telegramId, email, phone in response |
| T-02-02-04: /feed with no city set | Handled — `cityId ?? -1` returns empty array gracefully |
| T-02-02-05: Duplicate swipe 409 | Implemented — ConflictException before create |

## Self-Check: PASSED

- File `roomies back/src/feed/feed.service.ts` — FOUND
- File `roomies back/src/feed/feed.controller.ts` — FOUND
- File `roomies back/src/feed/feed.module.ts` — FOUND
- File `roomies back/src/swipe/swipe.service.ts` — FOUND
- File `roomies back/src/swipe/swipe.controller.ts` — FOUND
- File `roomies back/src/swipe/swipe.module.ts` — FOUND
- File `roomies back/src/swipe/dto/create-swipe.dto.ts` — FOUND
- Commit fd0e5b8 (Task 1) — FOUND
- Commit 44c7af9 (Task 2) — FOUND
- TypeScript build clean — PASSED
- NestJS build clean — PASSED
