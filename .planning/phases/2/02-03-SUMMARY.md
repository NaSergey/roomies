---
phase: 02-matching-engine
plan: "02-03"
subsystem: frontend/matching
tags: [feed, swipe, matching, nextjs, react, fsd]
dependency_graph:
  requires: [02-02 GET /feed + POST /swipes backend endpoints, Phase 1 auth JWT token storage]
  provides: [SwipeDeck loading real candidates from DB, swipe actions recorded in DB, match overlay on mutual like]
  affects: [HomeView — MOCK_PROFILES removed, SwipeDeck now takes no props]
tech_stack:
  added: []
  patterns:
    - useEffect cancel guard (let cancelled = false) for async data fetch
    - Optimistic swipe animation — swipe() fires immediately, postSwipe awaits after
    - FSD import discipline — SwipeDeck imports api from shared/lib/api barrel
    - ProfileCard as pure presentational component updated for API-aligned field shapes
key_files:
  created:
    - front/shared/lib/api/feed.ts
  modified:
    - front/shared/lib/api/index.ts
    - front/entities/profile/model/types.ts
    - front/entities/profile/model/mock-profiles.ts
    - front/entities/profile/index.ts
    - front/entities/profile/ui/ProfileCard.tsx
    - front/widgets/swipe-deck/ui/SwipeDeck.tsx
    - front/widgets/home/ui/HomeView.tsx
decisions:
  - "feed.ts imports apiFetch from './client' directly (not from barrel index.ts) to prevent circular dependency feed.ts → index.ts → feed.ts"
  - "handleSwipe is async but SwipeHandler type is sync void — TS allows this; animation fires immediately without awaiting the API call"
  - "ProfileCard renders a house emoji placeholder when photos[] is empty — prevents broken image elements for seed users with no photo URLs"
  - "mock-profiles.ts updated to match new RoomieProfile shape — kept on disk as dev reference, not exported from barrel"
metrics:
  duration: 15m
  completed_date: "2026-06-10"
  tasks_completed: 2
  files_modified: 8
---

# Phase 2 Plan 3: Frontend Wiring — Real Feed + Swipe Recording Summary

**One-liner:** Replaced MOCK_PROFILES with GET /feed data in SwipeDeck, wired POST /swipes on each card action, and added a match overlay when a mutual like is returned from the backend.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | API layer — getFeed(), postSwipe(), updated RoomieProfile type | 7c8a6b8 | feed.ts (new), api/index.ts, profile/types.ts, profile/index.ts |
| 2 | ProfileCard updated + SwipeDeck wired to real feed + match overlay | 0e422ac | ProfileCard.tsx, SwipeDeck.tsx, HomeView.tsx, mock-profiles.ts |

## What Was Built

### `front/shared/lib/api/feed.ts` (new)

Two typed API functions:

- `getFeed()` — `GET /feed` with JWT auth, returns `FeedCandidate[]`
- `postSwipe(targetId, action)` — `POST /swipes` with JWT auth, returns `SwipeResult`

Both import `apiFetch` directly from `'./client'` to avoid a circular dependency through the barrel.

### Updated `RoomieProfile` type

Old fields removed: `age`, `city`, `bio`, `tags` (string[]), `photo` (singular), `roomieScore`, `budget` (string).

New fields: `photos: string[]`, `vibeTags: { id, label }[]`, `districts: { id, name }[]`, `lifestyleScales`, `scenario`, `budgetMin/budgetMax`, `matchScore`.

### Updated `ProfileCard.tsx`

Now renders: name, first photo (`photos[0]`) with house emoji fallback, district name (from `districts[0].name`), budget range formatted as "40–55к ₽", up to 3 vibe tag labels, and `matchScore` as a percentage pill.

### Refactored `SwipeDeck.tsx`

Removed `profiles` prop entirely. Component is now self-contained:

1. Fetches candidates from `getFeed()` on mount with cancel guard
2. Shows animated loading dots while fetching
3. Wraps `swipe()` from `useSwipeDeck` in `handleSwipe` which: fires the animation optimistically, then `await`s `postSwipe()` — if `matched: true`, sets `matchState`
4. Renders match overlay with "It's a match!" heading, candidate name, and "Начать общение" dismiss button
5. `handleReset` calls `getFeed()` again to repopulate fresh candidates before resetting deck index

### Updated `HomeView.tsx`

Removed `MOCK_PROFILES` import and `profiles={MOCK_PROFILES}` prop. `<SwipeDeck />` now takes no props.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] mock-profiles.ts caused TS2322 build errors after RoomieProfile type change**

- **Found during:** Task 2 verification (npx tsc --noEmit)
- **Issue:** `mock-profiles.ts` still used old field shapes (age, city, bio, tags as string[], photo as string, roomieScore) which no longer exist in the updated `RoomieProfile` interface. Even though the file was removed from the barrel export, TypeScript still type-checks all files included in `tsconfig.json`.
- **Fix:** Updated `mock-profiles.ts` to use the new `RoomieProfile` shape (photos[], vibeTags objects, districts objects, lifestyleScales, matchScore 0–1). File is kept on disk as a dev reference, still not exported from barrel.
- **Files modified:** `front/entities/profile/model/mock-profiles.ts`
- **Commit:** 0e422ac (included in Task 2 commit)

## Threat Surface Review

| Mitigation | Status |
|------------|--------|
| T-02-03-03: getFeed network failure on mount | Implemented — try/catch in useEffect sets loading=false (via finally) on error; empty array → EmptyState renders gracefully |
| T-02-03-01: postSwipe targetId from server | Confirmed — targetId comes from `visible[0].id` loaded from GET /feed; not from any user input field |
| T-02-03-02: Match overlay shows candidate name | Accepted — name already visible on the swipe card being interacted with; no new disclosure |

## Known Stubs

- "Начать общение" button in the match overlay calls `setMatchState(null)` only — no chat navigation. Phase 4 (Chat) will wire this to an actual chat room. Intentional per plan.

## Self-Check: PASSED

- File `front/shared/lib/api/feed.ts` — FOUND
- File `front/entities/profile/model/types.ts` (updated) — FOUND
- File `front/entities/profile/index.ts` (MOCK_PROFILES removed) — FOUND
- File `front/entities/profile/ui/ProfileCard.tsx` (updated) — FOUND
- File `front/widgets/swipe-deck/ui/SwipeDeck.tsx` (real feed wired) — FOUND
- File `front/widgets/home/ui/HomeView.tsx` (MOCK_PROFILES removed) — FOUND
- Commit 7c8a6b8 (Task 1) — FOUND
- Commit 0e422ac (Task 2) — FOUND
- TypeScript build: 0 errors — PASSED
- MOCK_PROFILES not in HomeView — PASSED
- getFeed present in SwipeDeck — PASSED
- postSwipe present in SwipeDeck — PASSED
- matchState overlay present in SwipeDeck — PASSED
- profile.photo (singular) not in ProfileCard — PASSED
