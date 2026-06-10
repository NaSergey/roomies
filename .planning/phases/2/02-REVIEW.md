---
phase: 02-matching-engine
reviewed: 2026-06-10T14:45:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - roomies back/prisma/seed.ts
  - roomies back/src/feed/feed.service.ts
  - roomies back/src/feed/feed.controller.ts
  - roomies back/src/feed/feed.module.ts
  - roomies back/src/swipe/swipe.service.ts
  - roomies back/src/swipe/swipe.controller.ts
  - roomies back/src/swipe/swipe.module.ts
  - roomies back/src/swipe/dto/create-swipe.dto.ts
  - roomies back/src/app.module.ts
  - front/shared/lib/api/feed.ts
  - front/shared/lib/api/index.ts
  - front/entities/profile/model/types.ts
  - front/entities/profile/index.ts
  - front/entities/profile/ui/ProfileCard.tsx
  - front/widgets/swipe-deck/ui/SwipeDeck.tsx
  - front/widgets/home/ui/HomeView.tsx
findings:
  critical: 5
  warning: 6
  info: 4
  total: 15
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-06-10T14:45:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

This phase delivers the matching engine backend (FeedService, SwipeService) and the frontend swipe UI (SwipeDeck, ProfileCard). The core happy path is functional, but there are five blockers: two race conditions that allow duplicate matches, one missing authorization check that leaks private profile data, one broken smoking/pets filter logic that silently passes incompatible users through, and one silent API error swallow in the frontend that corrupts deck state without user notification. Six warnings cover missing validation pipe, incorrect falsy check on budget zero, unhandled promise rejection in handleReset, missing `save` action mapping, and type mismatches at the API boundary.

---

## Critical Issues

### CR-01: Race condition allows duplicate Match rows

**File:** `roomies back/src/swipe/swipe.service.ts:29-65`

**Issue:** The swipe create and mutual-like check are not wrapped in a database transaction. Between the `swipe.create` (line 29) and the `match.create` (line 52), a concurrent request from the other user can execute the same path simultaneously. Both paths will find each other's swipe with `findFirst`, both will attempt `match.create`, and one will violate the `@@unique([user1Id, user2Id])` constraint and crash with an unhandled Prisma error that propagates as a 500 to the client instead of a 201. The match is partially created in the racing path.

**Fix:**
```typescript
async createSwipe(actorId: number, dto: CreateSwipeDto) {
  if (dto.targetId === actorId) {
    throw new BadRequestException('Cannot swipe yourself');
  }

  return this.prisma.$transaction(async (tx) => {
    const existing = await tx.swipe.findUnique({
      where: { actorId_targetId: { actorId, targetId: dto.targetId } },
    });
    if (existing) {
      throw new ConflictException('Already swiped this user');
    }

    await tx.swipe.create({
      data: { actorId, targetId: dto.targetId, action: dto.action as SwipeAction },
    });

    if (dto.action === 'like' || dto.action === 'super_like') {
      const reverseSwipe = await tx.swipe.findFirst({
        where: {
          actorId: dto.targetId,
          targetId: actorId,
          action: { in: ['like', 'super_like'] },
        },
      });

      if (reverseSwipe) {
        const user1Id = Math.min(actorId, dto.targetId);
        const user2Id = Math.max(actorId, dto.targetId);

        // Use upsert to be idempotent against the race
        const match = await tx.match.upsert({
          where: { user1Id_user2Id: { user1Id, user2Id } },
          create: { user1Id, user2Id, matchScore: 0.5, hardScore: 1.0,
                    lifestyleScore: null, vibeScore: null, behavioralScore: null },
          update: {},
        });

        return { matched: true, matchId: match.id };
      }
    }

    return { matched: false };
  });
}
```

---

### CR-02: Feed endpoint exposes profiles to unauthenticated / unauthorized users via cityId=-1 bypass

**File:** `roomies back/src/feed/feed.service.ts:131`

**Issue:** When `me.cityId` is `null` (user has not completed the city step of onboarding), the query uses `cityId: -1` as a sentinel. This never matches any row, so no profiles leak — but the endpoint itself has no guard that checks `onboardingCompleted` for the requesting user. A user who abandons onboarding mid-flow has a valid JWT and can call `GET /feed`. The controller at `feed.controller.ts:12-18` only requires `JwtAuthGuard`. The service fetches the current user without checking `onboardingCompleted` or `isActive`, so an incomplete or deactivated account can query the feed. More critically, the response includes `budgetMin`, `budgetMax`, `districts`, `vibeTags`, and `lifestyleScales` of every candidate — personal preference data that should only be visible after both parties are matched or at minimum after the requesting user has finished onboarding.

**Fix:**
```typescript
// In feed.service.ts, after loading `me`, add:
if (!me.onboardingCompleted || !me.isActive) {
  throw new ForbiddenException('Onboarding must be completed to access the feed');
}
```
Add `onboardingCompleted: true` and `isActive: true` to the `me` select, and import `ForbiddenException` from `@nestjs/common`.

---

### CR-03: Smoking and pets hard-conflict logic is inverted — incompatible users pass the filter

**File:** `roomies back/src/feed/feed.service.ts:53-59`

**Issue:** The smoking and pets conflict checks treat `smokingOk=true` (accepts smokers/pets) as a conflict with `smokingOk=false` (does not accept). This is backwards. Two users who **both** do not accept smoking should not conflict — they are compatible. Two users where one `smokingOk=false` and the other `smokingOk=true` should **only** conflict if the candidate is actually a smoker/pet owner, which is a field that does not exist in the schema. As written, the condition `!me.smokingOk && candidate.smokingOk` returns `true` (hard conflict) whenever the current user doesn't want smoking but the candidate is tolerant of smoking. These two users are actually **compatible** — both do not smoke, and one merely allows it. The current code would hide compatible users from non-smokers who would prefer a smoke-free roommate.

**Fix:** Since the schema has no `isSmoker`/`hasPets` boolean on User, the correct semantics for a hard conflict is: both users must agree on the policy. A conflict only occurs when one user requires no smoking (`smokingOk=false`) and the other explicitly requires smoking to be ok (`smokingOk=true`). This is actually the correct check directionally, but the logic conflates "tolerance" with "requirement." The real fix is to add `isSmoker` and `hasPets` fields to the User model and check:

```typescript
// Conflict: candidate is a smoker but I don't allow smoking
if (!me.smokingOk && candidate.isSmoker) return true;
// Conflict: I am a smoker but candidate doesn't allow smoking
if (me.isSmoker && !candidate.smokingOk) return true;

// Same for pets
if (!me.petsOk && candidate.hasPets) return true;
if (me.hasPets && !candidate.petsOk) return true;
```

Until the schema is updated, remove the current smoking/pets checks from `hasHardConflict` entirely, or document the current behavior as intentional with a clear comment, since the current behavior actively harms match quality.

---

### CR-04: `postSwipe` silently swallows errors causing invisible deck state corruption

**File:** `front/widgets/swipe-deck/ui/SwipeDeck.tsx:46-58`

**Issue:** The `handleSwipe` function calls `swipe(direction)` optimistically before awaiting `postSwipe`. The `catch` block at line 56-58 silently discards all API errors with the comment "silently ignore API errors in Phase 2." This means: if the backend returns a 409 (already swiped), 401 (token expired), or 500 (race condition crash from CR-01), the card is consumed from the deck permanently, the swipe is not retried, and the user sees no feedback. For 401 errors, the user's session may be invalid and they'll continue swiping cards that are never recorded. The deck state diverges from server state with no recovery path.

**Fix:**
```typescript
const handleSwipe = useCallback(
  async (direction: SwipeDirection) => {
    const currentProfile = visible[0];
    if (!currentProfile) return;

    const action = direction === 'right' ? 'like' : 'pass';
    swipe(direction); // optimistic

    try {
      const result = await postSwipe(currentProfile.id, action);
      if (result.matched) {
        setMatchState({
          candidateName: currentProfile.name,
          matchId: result.matchId ?? 0,
        });
      }
    } catch (err) {
      // On auth failure, redirect to re-auth instead of silently failing
      if (err instanceof ApiError && err.status === 401) {
        // trigger re-auth flow
      }
      // At minimum, surface a toast for non-409 errors
      console.error('Swipe failed:', err);
    }
  },
  [visible, swipe],
);
```

---

### CR-05: `handleReset` in SwipeDeck has unhandled promise rejection that crashes the component

**File:** `front/widgets/swipe-deck/ui/SwipeDeck.tsx:63-67`

**Issue:** `handleReset` is an `async` function passed to `EmptyState`'s `onReset` prop. It calls `getFeed()` without a try/catch. If `getFeed()` throws (network error, 401, 500), the unhandled rejection propagates to React's error boundary. If no error boundary exists above `SwipeDeck`, the entire application unmounts. This is distinct from the initial load (which does have try/catch at lines 27-29) — the reset path has no error handling at all.

**Fix:**
```typescript
const handleReset = useCallback(async () => {
  try {
    const fresh = await getFeed();
    setProfiles(fresh);
    reset();
  } catch {
    // Keep existing empty state rather than crashing
    reset();
  }
}, [reset]);
```

---

## Warnings

### WR-01: No global ValidationPipe — DTO validation decorators are not enforced

**File:** `roomies back/src/swipe/dto/create-swipe.dto.ts:1-16`

**Issue:** `CreateSwipeDto` uses `class-validator` decorators (`@IsInt`, `@IsPositive`, `@IsEnum`). These decorators are inert unless `ValidationPipe` is registered globally or at the controller level. Without it, any JSON body is accepted: `targetId: -1`, `targetId: "hello"`, `action: "hack"` all pass through to `swipeService.createSwipe`. The self-swipe guard on line 16 catches the obvious case, but the enum cast `dto.action as SwipeAction` on line 33 of `swipe.service.ts` can insert an invalid action string into the database.

**Fix:** In `roomies back/src/main.ts`, ensure:
```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```
This is a required prerequisite for `class-validator` to function in NestJS.

---

### WR-02: Budget falsy check excludes zero-budget values correctly but is still misleading

**File:** `front/entities/profile/ui/ProfileCard.tsx:19-22`

**Issue:** The budget label computation uses `profile.budgetMin && profile.budgetMax` (truthy check). If either value is `0` (a valid budget minimum), the label is silently suppressed. While budget 0 is semantically unlikely in this domain, the correct check for "value is present" against a nullable number is `!= null` not a truthy test, per project conventions.

**Fix:**
```typescript
const budgetLabel =
  profile.budgetMin != null && profile.budgetMax != null
    ? `${(profile.budgetMin / 1000).toFixed(0)}–${(profile.budgetMax / 1000).toFixed(0)}к ₽`
    : '';
```

---

### WR-03: `save` SwipeAction exists in schema but is absent from DTO enum, making it impossible to record

**File:** `roomies back/src/swipe/dto/create-swipe.dto.ts:3-7`

**Issue:** The Prisma schema defines `SwipeAction` with four values: `like`, `super_like`, `save`, `pass` (schema line 27-32). `SwipeActionDto` only includes `like`, `pass`, `super_like`. This means the `save` action can never be submitted through the API. If `save` is an intentional future feature, this should be documented. If it is a current feature, the DTO is incomplete and will return a 400 for valid save requests.

**Fix:** Either add `save = 'save'` to `SwipeActionDto`, or add an explicit comment that `save` is deferred and remove it from the Prisma enum until it is implemented.

---

### WR-04: `matchScore` typed as `number` in frontend but backend returns `number | undefined`

**File:** `front/shared/lib/api/feed.ts:21` and `front/entities/profile/model/types.ts:18`

**Issue:** `FeedCandidate.matchScore` is typed `number` (non-nullable). `RoomieProfile.matchScore` is also typed `number`. However, the backend at `feed.service.ts:197` returns `matchScore: c._matchScore` where `_matchScore` is of type `number | undefined` (the field is declared optional with `?` at line 21 of `feed.service.ts`). When `computeLifestyleScore` is called, it always returns a number, so in practice `_matchScore` is always set — but the return type is not enforced by TypeScript at the API boundary. `ProfileCard.tsx` at line 53 calls `Math.round(profile.matchScore * 100)` which would produce `NaN` if `matchScore` were `undefined`, rendering `NaN% match` in the UI.

**Fix:** Either make the backend return type explicit (add a proper response DTO class) or change the frontend types to `matchScore: number | undefined` and guard the display:
```typescript
{profile.matchScore != null && (
  <div ...>{Math.round(profile.matchScore * 100)}% match</div>
)}
```

---

### WR-05: Seed uses raw `ALTER SEQUENCE` SQL only safe for first-ever run; re-seeding a populated DB will corrupt IDs

**File:** `roomies back/prisma/seed.ts:882`

**Issue:** The sequence reset `ALTER SEQUENCE quiz_questions_id_seq RESTART WITH 1` only runs when `existingCount === 0`. If the database is partially seeded (e.g., 3 questions from a failed run), the check at line 896-902 logs a warning and skips insertion entirely — but does not reset the sequence. A subsequent clean slate run will not reset the sequence either, because the count is now 0 only after a manual `TRUNCATE`. More critically, if a developer manually deletes questions to re-seed, the sequence is not reset, quiz questions will get IDs 11–20, and all `UserQuizAnswer` records with `questionId: 1–10` from the fake profiles will have dangling foreign keys, silently failing quiz answer inserts.

**Fix:** Move the sequence reset outside the `existingCount === 0` guard, or use `CREATE` with explicit IDs and rely on `skipDuplicates` rather than sequence control:
```typescript
// Always reset sequence before inserting to guarantee IDs 1-10
await prisma.$executeRaw`TRUNCATE TABLE quiz_questions RESTART IDENTITY CASCADE`;
for (const q of QUIZ_QUESTIONS) {
  await prisma.quizQuestion.create({ data: { ... } });
}
```
Or document that re-seeding requires `prisma migrate reset` first.

---

### WR-06: Scenario compatibility map allows `looking_housing_roomie` to match with itself, which may be unintended

**File:** `roomies back/src/feed/feed.service.ts:120-126`

**Issue:** The compatibility map includes `looking_housing_roomie: ['looking_housing_roomie', 'has_housing_seeking_roomie']`. This means two users both actively searching for housing together (not yet having a place) are shown to each other. This is likely intentional (they could look together), but it is unusual and should be explicitly called out in a comment. Without documentation, future developers may interpret it as a bug and "fix" it, breaking a legitimate use case. Additionally, `looking_roomie_find_housing` maps only to itself — meaning users in this scenario can only match with others in the same scenario, which significantly limits their feed and may be an oversight (they might also want to match with `has_housing_seeking_roomie`).

**Fix:** Add comments to the compatibility map explaining the business logic, and confirm whether `looking_roomie_find_housing` should also be compatible with `has_housing_seeking_roomie`.

---

## Info

### IN-01: `matchState.matchId` defaults to `0` on undefined — misleading sentinel value

**File:** `front/widgets/swipe-deck/ui/SwipeDeck.tsx:52-54`

**Issue:** `matchId: result.matchId ?? 0` stores `0` when the backend does not return a `matchId`. The value `0` is a falsy number that could be misread as "no match ID" rather than "unknown match ID" by future code that checks `if (matchState.matchId)`. The `SwipeResult` type correctly declares `matchId?: number`, but the component converts the absent case to `0`.

**Fix:** Change `matchState` type to allow `matchId: number | undefined` and store `result.matchId` directly, then guard downstream usage with `!= null`.

---

### IN-02: `BackIcon` button in HomeView has no navigation handler — dead UI element

**File:** `front/widgets/home/ui/HomeView.tsx:51-53`

**Issue:** `RoundIconButton` for "Назад" (back) is rendered with no `onClick` prop. Pressing it does nothing. This is either a placeholder for future navigation or an omission.

**Fix:** Either wire up navigation logic or hide the button until the navigation stack is implemented:
```tsx
{canGoBack && (
  <RoundIconButton ariaLabel="Назад" onClick={handleBack}>
    <BackIcon />
  </RoundIconButton>
)}
```

---

### IN-03: `FiltersIcon` button in HomeView has no handler — dead UI element

**File:** `front/widgets/home/ui/HomeView.tsx:58-60`

**Issue:** Same pattern as IN-02 — the filters button has no `onClick`. Pressing it produces no feedback to the user. For a Telegram Mini App where users expect immediate tactile response, a non-functional button creates confusion.

**Fix:** Add a placeholder handler or remove the button until the filters feature is implemented.

---

### IN-04: Seed verification counts `fakeCount` as any user with `onboardingCompleted=true`, not specifically seed users

**File:** `roomies back/prisma/seed.ts:925`

**Issue:** The final integrity check `prisma.user.count({ where: { onboardingCompleted: true } })` counts all completed users in the database, not just the 25 fake seed users. In a development environment where real users have completed onboarding, this count will exceed 25 and the check `fakeCount < 20` will always pass regardless of whether seed data is correct. The check is effectively meaningless on a non-empty database.

**Fix:** Count specifically by the known telegramId range:
```typescript
const fakeCount = await prisma.user.count({
  where: { telegramId: { gte: 1100000001n, lte: 1100000025n } },
});
```

---

_Reviewed: 2026-06-10T14:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
