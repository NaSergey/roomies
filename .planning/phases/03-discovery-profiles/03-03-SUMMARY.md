---
plan: 03-03
phase: 03-discovery-profiles
status: complete
completed: 2026-06-22
tasks_completed: 2
tasks_total: 2
self_check: PASSED
---

# Plan 03-03 Summary — Frontend Types, API Layer & Shared UI Atoms

## What Was Built

### Task 1: Types, API functions, React Query hooks

**RoomieProfile** (`entities/profile/model/types.ts`) extended with:
- `smokingOk: boolean`, `petsOk: boolean`, `guestsPref: 'rarely' | 'sometimes' | 'often'`
- `matchReasons: string[]`, `matchRisks?: string[]`

**feed.ts** (`shared/lib/api/feed.ts`):
- `FeedQueryParams` interface (budgetMin, budgetMax, districtIds[], smokingOk, petsOk, guestsPref)
- `FeedCandidate` extended with 5 new fields matching RoomieProfile
- `getFeed(params?: FeedQueryParams)` — builds URLSearchParams, appends districtIds as multiple entries
- `postSwipe` action union extended to include `'save'`

**profile.ts** (`shared/lib/api/profile.ts`) — new file:
- `MyProfile` interface (all own-profile fields + roomieScore, quizCompleted, onboardingStep)
- `UpdateProfilePayload` interface
- `getMe()` → GET /profile/me
- `patchProfile(dto)` → PATCH /profile

**api/index.ts**: re-exports FeedQueryParams, MyProfile, UpdateProfilePayload, getMe, patchProfile

**use-feed-query.ts** (`features/swipe-profile/model/`):
- `feedKeys.filtered(params)` queryKey factory
- `useFeedQuery(params?)` — queryKey switches based on params presence
- `useSwipeMutation` action type extended to `'like' | 'pass' | 'super_like' | 'save'`; invalidates on like+super_like

**features/profile** (new):
- `use-profile-query.ts`: `useProfileQuery()` (staleTime: Infinity), `usePatchProfile()` (invalidates me)
- `index.ts` barrel

### Task 2: Shared UI components

**VibeScaleBar** (`shared/ui/vibe-scale-bar/`):
- Props: `scaleKey`, `value: number | null` — returns null for null value
- 5 scale keys with RU labels + emoji (noiseLevel, cleanliness, sleepSchedule, socialLevel, workFromHome)
- Lime/peach/rose fill color by value tier (≥0.71 / ≥0.4 / below)

**RulesSection** (`shared/ui/rules-section/`):
- Props: smokingOk, petsOk, guestsPref
- 3 read-only neobrutalism chips, lime active / white inactive

**MatchReasonsList** (`shared/ui/match-reasons-list/`):
- Props: matchReasons[], matchRisks?[]
- Returns null for empty matchReasons
- ✨ reason bullets + ⚠️ risk chip (first risk only)

## Commits

- `a36bf70` feat(03-03): extend types, API layer, and React Query hooks
- `69f47a7` feat(03-03): shared UI atoms — VibeScaleBar, RulesSection, MatchReasonsList

## Self-Check

- [x] RoomieProfile includes matchReasons, matchRisks, smokingOk, petsOk, guestsPref
- [x] useFeedQuery accepts FeedQueryParams, queryKey varies by params
- [x] useSwipeMutation accepts all 4 actions: like, pass, super_like, save
- [x] useProfileQuery fetches GET /profile/me, returns MyProfile shape
- [x] usePatchProfile calls PATCH /profile, invalidates profileKeys.me
- [x] VibeScaleBar renders null for null value, lime fill for value≥0.71
- [x] RulesSection renders 3 chips with lime/white conditional styling
- [x] MatchReasonsList returns null for empty matchReasons array
- [x] TypeScript build: `npx tsc --noEmit` — no errors

## key-files.created

- front/shared/lib/api/profile.ts
- front/shared/ui/vibe-scale-bar/VibeScaleBar.tsx
- front/shared/ui/rules-section/RulesSection.tsx
- front/shared/ui/match-reasons-list/MatchReasonsList.tsx
- front/features/profile/model/use-profile-query.ts
- front/features/profile/index.ts
