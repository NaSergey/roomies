---
plan: 03
phase: 03-discovery-profiles
status: issues_found
files_reviewed: 31
files_reviewed_list:
  - roomies back/src/feed/dto/feed-query.dto.ts
  - roomies back/src/feed/feed.service.ts
  - roomies back/src/feed/feed.controller.ts
  - roomies back/src/swipe/dto/create-swipe.dto.ts
  - roomies back/src/profile/profile.service.ts
  - roomies back/src/profile/dto/update-profile.dto.ts
  - roomies back/src/profile/profile.controller.ts
  - roomies back/src/profile/profile.module.ts
  - front/entities/profile/model/types.ts
  - front/shared/lib/api/feed.ts
  - front/shared/lib/api/profile.ts
  - front/shared/lib/api/index.ts
  - front/features/swipe-profile/model/use-feed-query.ts
  - front/features/profile/model/use-profile-query.ts
  - front/shared/ui/vibe-scale-bar/VibeScaleBar.tsx
  - front/shared/ui/rules-section/RulesSection.tsx
  - front/shared/ui/match-reasons-list/MatchReasonsList.tsx
  - front/entities/profile/model/mock-profiles.ts
  - front/entities/profile/ui/ProfileCard.tsx
  - front/features/swipe-profile/ui/SwipeCard.tsx
  - front/features/swipe-profile/ui/ActionButtons.tsx
  - front/features/swipe-profile/index.ts
  - front/widgets/swipe-deck/ui/FilterSheet.tsx
  - front/widgets/swipe-deck/ui/DeckToolbar.tsx
  - front/widgets/swipe-deck/ui/SwipeDeck.tsx
  - front/widgets/candidate-profile/ui/CandidateProfileSheet.tsx
  - front/widgets/candidate-profile/index.ts
  - front/widgets/profile/ui/ProfileView.tsx
  - front/widgets/profile/ui/RoomieScoreCard.tsx
  - front/widgets/profile/ui/ProfileEditSheet.tsx
  - front/widgets/profile/index.ts
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
---

# Phase 03: Code Review Report

**Reviewed:** 2026-06-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

Phase 3 adds the Discovery & Profiles feature: a backend feed endpoint with scoring/filtering, profile GET/PATCH, and a full frontend swipe deck with filters, candidate profile sheet, and profile edit sheet. Security fundamentals are sound — userId flows from JWT via `@CurrentUser()` on every guarded endpoint, no SQL injection vectors, and `initData` trust is deferred to the existing auth layer. The main defects are: a query-parameter key mismatch that silently breaks district filtering, a `filter(Boolean)` bug that mangles zero-value budgets, a misleading hardcoded match-reason string, and unguarded async calls that produce silent failures.

---

## Critical Issues

### CR-001 [CRITICAL] District filter silently broken — frontend sends `districtIds[]`, backend expects `districtIds`

**File:** `front/shared/lib/api/feed.ts:53`

**Issue:** The frontend serialises district IDs with bracket notation (`districtIds[]=1&districtIds[]=2`). NestJS receives the key literally as `districtIds[]`, which does not map to the `FeedQueryDto.districtIds` property. The DTO's `@IsArray()` + `@Type(() => Number)` decorators never see the value; the filter is silently ignored for every request that includes districts.

**Fix:** Remove the brackets — use the bare key so NestJS can map it to the array property:

```ts
// front/shared/lib/api/feed.ts  line 52–54
if (params.districtIds) {
  params.districtIds.forEach((id) => qs.append('districtIds', String(id)));
}
```

NestJS's `ValidationPipe` with `transform: true` (and `@Type(() => Number)`) handles repeated keys automatically when the key matches the DTO property name exactly.

---

### CR-002 [CRITICAL] `filter(Boolean)` drops zero-value budget in `CandidateProfileSheet`

**File:** `front/widgets/candidate-profile/ui/CandidateProfileSheet.tsx:75`

**Issue:** `[candidate.budgetMin, candidate.budgetMax].filter(Boolean)` treats the value `0` as falsy and removes it. If either budget is `0` the displayed string is wrong (e.g., a range of `0–30000` renders as `30000 ₽`). The same helper in `ProfileView` uses the correct `filter((v) => v != null)` — this file regressed.

**Fix:**

```ts
// CandidateProfileSheet.tsx  line 75–77
const budgetStr = candidate
  ? [candidate.budgetMin, candidate.budgetMax]
      .filter((v) => v != null)
      .join('–') + ' ₽'
  : '';
```

---

## Warnings

### WR-001 [WARNING] `generateMatchReasons` emits "Оба любят тишину дома" regardless of actual noise level direction

**File:** `roomies back/src/feed/feed.service.ts:118`

**Issue:** The message is hardcoded to "Both love silence at home" but it fires whenever the two users' `noiseLevel` values are within 0.2 of each other — including when both have high values (e.g., `0.8` and `0.9`), meaning both are noisy. The displayed reason contradicts reality.

**Fix:** Make the message reflect the actual value range:

```ts
if (
  me.noiseLevel != null &&
  candidate.noiseLevel != null &&
  Math.abs(Number(me.noiseLevel) - Number(candidate.noiseLevel)) < 0.2
) {
  const avgNoise = (Number(me.noiseLevel) + Number(candidate.noiseLevel)) / 2;
  reasons.push(avgNoise < 0.4 ? 'Оба предпочитают тишину дома' : 'Схожий уровень шума дома');
}
```

---

### WR-002 [WARNING] `handleAction` swallows swipe API errors silently

**File:** `front/widgets/swipe-deck/ui/SwipeDeck.tsx:52`

**Issue:** `handleAction` is `async` and calls `swipeMutation.mutateAsync(...)` without a `try/catch`. When the API returns an error (network failure, 4xx, 5xx), `mutateAsync` throws — the exception propagates out of the `useCallback` closure and results in an unhandled promise rejection. The deck also advances (the swipe animation has already fired via `swipe(swipeDir)` before the `await`), so the card is consumed but the action is not recorded on the server. The user is not informed of the failure.

**Fix:**

```ts
const handleAction = useCallback(
  async (action: 'like' | 'pass' | 'save' | 'super_like') => {
    const currentProfile = visible[0];
    if (!currentProfile) return;

    const swipeDir: SwipeDirection = action === 'pass' ? 'left' : 'right';
    if (!swipe(swipeDir)) return;

    try {
      const result = await swipeMutation.mutateAsync({ targetId: currentProfile.id, action });
      if (result.matched && result.matchId != null) {
        setMatchState({ candidateName: currentProfile.name, matchId: result.matchId });
      }
    } catch {
      // Swipe is already animated; log or show toast if needed
      console.error('Swipe action failed for target', currentProfile.id);
    }
  },
  [visible, swipe, swipeMutation],
);
```

---

### WR-003 [WARNING] `ProfileEditSheet.handleSave` — no error feedback when patch fails

**File:** `front/widgets/profile/ui/ProfileEditSheet.tsx:81`

**Issue:** `patch.mutateAsync(payload)` throws on API error. Because there is no `try/catch`, the thrown error propagates out of `handleSave`, leaving the sheet open and the Save button re-enabled (once `isPending` clears), but with no visible error message. The user cannot tell whether the save succeeded or failed.

**Fix:** Wrap in try/catch and surface the error:

```ts
async function handleSave() {
  // ... build payload ...
  if (Object.keys(payload).length > 0) {
    try {
      await patch.mutateAsync(payload);
    } catch {
      // Display inline error; do not close the sheet
      return;
    }
  }
  onClose();
}
```

Add an error display element driven by `patch.isError` / `patch.error`.

---

### WR-004 [WARNING] `FilterSheet` hardcodes city ID `1` for district fetch

**File:** `front/widgets/swipe-deck/ui/FilterSheet.tsx:79`

**Issue:** `getDistricts(1)` always fetches districts for city ID 1. If the platform expands to additional cities, or if the current user belongs to a different city, the district list shown will be wrong or irrelevant. There is no mechanism to pass the current user's city into the sheet.

**Fix:** Accept `cityId` as a prop (derived from the authenticated user's profile via `useProfileQuery`) and pass it to `getDistricts`:

```ts
// FilterSheet props
interface FilterSheetProps {
  open: boolean;
  filters: DeckFilters;
  cityId: number;          // <-- add
  onChange: (f: DeckFilters) => void;
  onApply: (filters: DeckFilters) => void;
  onClose: () => void;
}

// inside useEffect
getDistricts(cityId)  // <-- was hardcoded 1
```

---

### WR-005 [WARNING] `RoomieProfile` entity type has `lifestyleScales: ... | null` but `FeedCandidate` API type does not — type contract divergence

**File:** `front/entities/profile/model/types.ts:11` and `front/shared/lib/api/feed.ts:24`

**Issue:** The entity-layer `RoomieProfile.lifestyleScales` is typed as `{ ... } | null`, while the API-layer `FeedCandidate.lifestyleScales` is typed as `{ ... }` (not nullable). `useSwipeDeck` accepts `RoomieProfile[]` but `SwipeDeck` passes `FeedCandidate[]` — this compiles due to structural typing, but the types diverge silently. Any code added in the future that calls `profile.lifestyleScales.noiseLevel` on a `RoomieProfile` will fail at runtime if the entity type is ever correctly narrowed while the API response still sends a non-null object.

**Fix:** Align both types. If the backend always returns `lifestyleScales` as a non-null object (as shown in `feed.service.ts` response shape), make both non-nullable:

```ts
// front/entities/profile/model/types.ts
lifestyleScales: {
  noiseLevel: number | null;
  cleanliness: number | null;
  sleepSchedule: number | null;
  socialLevel: number | null;
  workFromHome: number | null;
};  // remove "| null"
```

---

## Info

### IN-001 [INFO] `ProfileCard` always renders verification badge regardless of verification status

**File:** `front/entities/profile/ui/ProfileCard.tsx:60`

**Issue:** The blue check-circle badge is rendered unconditionally. The backend's `getMe` response includes `isPhoneVerified`, but this field is not present in `RoomieProfile` (the entity type for feed candidates). Every candidate appears verified, which misrepresents trust status.

**Fix:** Add `isVerified?: boolean` to `RoomieProfile` and the feed response, then conditionally render the badge:

```tsx
{profile.isVerified && (
  <div className={`absolute right-0 top-0 z-[2] ...`}>
    <CheckIcon />
  </div>
)}
```

---

### IN-002 [INFO] `computeLifestyleScore` can produce values outside [0, 1] if Decimal fields are not normalized to [0, 1]

**File:** `roomies back/src/feed/feed.service.ts:99`

**Issue:** `1 - avgDiff` returns a negative score if any individual `diff > 1`. The Prisma schema types `noiseLevel` etc. as `Decimal | null` (typed here as `object | null`) with no explicit range constraint enforced at the DB level. If a seed or migration writes values outside [0, 1], the score becomes negative, causing the candidate to sort to the bottom. `matchScore` in the response would then be negative, and `Math.round(value * 100)` in `VibeScaleBar` would render a negative percentage.

**Fix:** Clamp the score after computation:

```ts
return Math.max(0, Math.min(1, 1 - avgDiff));
```

---

### IN-003 [INFO] `useSwipeMutation` only invalidates feed on `like`/`super_like`, not on `pass` or `save`

**File:** `front/features/swipe-profile/model/use-feed-query.ts:31`

**Issue:** After a swipe, swiped profiles are permanently excluded from subsequent feeds because the server records the swipe. But the local React Query cache still holds the full original list. Only `like` and `super_like` trigger cache invalidation; `pass` and `save` do not. On the next query (e.g., after switching screens and returning), the same passed/saved profiles reappear briefly until the cache revalidates.

**Fix:** Invalidate on all swipe actions, or remove swiped profiles from the local cache optimistically:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: feedKeys.all, exact: false });
}
```

---

_Reviewed: 2026-06-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
