---
phase: 03-discovery-profiles
plan: "01"
subsystem: backend-feed
tags: [feed, swipe, match-reasons, filter-params, backend]
dependency_graph:
  requires: []
  provides:
    - FeedQueryDto with optional filter params (budgetMin, budgetMax, districtIds, smokingOk, petsOk, guestsPref)
    - generateMatchReasons(me, candidate) → string[] (up to 3)
    - generateMatchRisks(me, candidate) → string[] (up to 1)
    - GET /feed response with matchReasons, matchRisks, smokingOk, petsOk, guestsPref
    - SwipeActionDto with save = 'save' (was missing)
  affects:
    - front/features/swipe-profile/model/use-feed-query.ts (feed response shape expanded)
    - front/widgets/swipe-deck/ui/FilterSheet.tsx (filter params now have backend support)
tech_stack:
  added: []
  patterns:
    - class-validator @IsOptional + @Transform for query string boolean parsing
    - Export pure functions from service for testability
key_files:
  created:
    - roomies back/src/feed/dto/feed-query.dto.ts
    - roomies back/src/feed/feed.service.spec.ts
    - roomies back/src/swipe/swipe.service.spec.ts
  modified:
    - roomies back/src/feed/feed.service.ts
    - roomies back/src/feed/feed.controller.ts
    - roomies back/src/swipe/dto/create-swipe.dto.ts
decisions:
  - generateMatchReasons and generateMatchRisks exported as named functions (not private methods) to allow direct unit-test imports without NestJS DI wiring
  - query.smokingOk ?? me.smokingOk pattern used for filter override (undefined check, not falsy)
  - meScoreFields intermediate object extracted to pass clean UserScoreFields to pure functions
metrics:
  duration: "186s"
  completed_date: "2026-06-22"
  tasks_completed: 2
  files_changed: 6
---

# Phase 3 Plan 01: Feed Service Extension — Backend Data Contracts

Extended the backend feed service to return matchReasons (Russian text strings) and matchRisks per candidate, added filter query params to GET /feed, and fixed the missing 'save' action in SwipeActionDto.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create FeedQueryDto and fix SwipeActionDto | 1c6e487 | feed-query.dto.ts, create-swipe.dto.ts |
| 2 | Extend FeedService — matchReasons, matchRisks, filter params | 092be9c | feed.service.ts, feed.controller.ts, feed.service.spec.ts, swipe.service.spec.ts |

## What Was Built

**FeedQueryDto** (`roomies back/src/feed/dto/feed-query.dto.ts`): Optional query filter params for GET /feed — `budgetMin`, `budgetMax`, `districtIds[]`, `smokingOk`, `petsOk`, `guestsPref`. All fields fully validated with class-validator. Boolean params use `@Transform` to coerce query strings (`'true'` → `true`).

**SwipeActionDto fix** (`roomies back/src/swipe/dto/create-swipe.dto.ts`): Added `save = 'save'` to the enum. The Prisma schema had all 4 actions (like, pass, super_like, save) but the DTO was missing `save`, causing `POST /swipes` with `action: 'save'` to return 400.

**generateMatchReasons()** exported from `feed.service.ts`: 8 compatibility checks — 5 lifestyle scale proximity checks (threshold < 0.2 diff), smokingOk match, petsOk match, guestsPref match. Returns up to 3 reasons as ready-to-display Russian strings.

**generateMatchRisks()**: Flags polar-opposite guestsPref (rarely vs often) as a soft risk. Returns up to 1 risk string.

**getFeed(userId, query: FeedQueryDto)**: Filter logic uses `query.smokingOk ?? me.smokingOk` pattern so query params override user defaults. District filter adds `districts: { some: { districtId: { in: query.districtIds } } }`. Response shape now includes `smokingOk`, `petsOk`, `guestsPref`, `matchReasons`, `matchRisks` per candidate.

**Unit tests**: 17 tests in `feed.service.spec.ts` (12 for matchReasons/matchRisks) + 5 tests in `swipe.service.spec.ts` including the `save` action storing without creating a Match. All 32 tests in the suite pass.

## Deviations from Plan

### Auto-added for testability

**[Rule 2 - Missing critical functionality] Exported generateMatchReasons and generateMatchRisks as named exports**

- **Found during:** Task 2 implementation
- **Issue:** The plan specified private methods, but private NestJS service methods require full DI module setup to test. Pattern from `onboarding.service.spec.ts` exports `computeScales` as a named function.
- **Fix:** Changed from private class methods to exported pure functions outside the class, matching the established pattern in the codebase.
- **Files modified:** `roomies back/src/feed/feed.service.ts`
- **Commit:** 092be9c

## Known Stubs

None. All matchReasons/matchRisks logic is real data-driven (not hardcoded placeholders). Filter params are fully wired to SQL WHERE.

## Threat Flags

All mitigations from the threat model were applied:

| Threat | Status |
|--------|--------|
| T-03-01: FeedQueryDto + ValidationPipe on query params | Mitigated — FeedQueryDto with class-validator decorators |
| T-03-02: userId from JWT only (never from query) | Maintained — service uses userId from JWT via @CurrentUser() |
| T-03-03: SwipeActionDto @IsEnum includes save | Mitigated — save added to enum, unknown values rejected |

## Self-Check

- [x] `roomies back/src/feed/dto/feed-query.dto.ts` exists
- [x] `roomies back/src/feed/feed.service.spec.ts` exists
- [x] `roomies back/src/swipe/swipe.service.spec.ts` exists
- [x] Commit 1c6e487 exists
- [x] Commit 092be9c exists
- [x] Build: clean (0 TypeScript errors)
- [x] Tests: 32/32 pass
