# Phase 2: Matching Engine — Context

**Gathered:** 2026-06-10
**Status:** Ready for planning
**Source:** User discussion (pre-planning)

<domain>
## Phase Boundary

Phase 2 delivers a real matching pipeline replacing mock data. After this phase, a logged-in user with a completed profile sees real candidates from the DB in the swipe feed, can like/pass them, and gets a Match record created on mutual like. The algorithm is intentionally simplified for the MVP — full cosine similarity and behavioral signals are deferred to Phase 3+ refinement.

**Key scope extension agreed by user:** Seed 20–30 fake completed profiles into the DB so the feed has data to show (no real users yet). Without this, the feed would always be empty.

</domain>

<decisions>
## Implementation Decisions

### Fake Profiles Seed
- **LOCKED**: Add 20–30 fake users to `prisma/seed.ts` with `onboardingCompleted: true`, randomized lifestyle scales, quiz answers, vibe tags, budget ranges, districts, scenarios
- All fakes have real `telegramId` values in the range 1_000_000_000 to 9_999_999_999 (safe, non-conflicting)
- Fakes are idempotent (upsert by `telegramId`) so re-seeding doesn't duplicate
- Mix of scenarios: mostly `looking_housing_roomie` and `has_housing_seeking_roomie` to enable matches

### Scoring Algorithm (Simplified)
- **LOCKED**: Simple lifestyle scale proximity score only — no cosine similarity, no pgvector
- Formula: `score = 1 - (avg absolute difference across 5 lifestyle scales)`
- If any hard factor conflicts (different city OR non-overlapping budget OR smoking mismatch if either is strict OR pets mismatch if either is strict) → score = 0, candidate excluded
- Hard conflicts are: `user.cityId != candidate.cityId`, `user.budgetMax < candidate.budgetMin || user.budgetMin > candidate.budgetMax`, `!user.smokingOk && candidate.smokingOk` (and vice versa), `!user.petsOk && candidate.petsOk` (and vice versa)
- Score stored as `matchScore` in Match table with `lifestyleScore` breakdown; `hardScore = 1.0` (passed hard filter), `vibeScore = null`, `behavioralScore = null` for now

### Feed Endpoint
- **LOCKED**: `GET /feed` — returns up to 20 candidate profiles for current user
- Filters: same city, compatible scenario (see scenario compat table below), `onboardingCompleted = true`, not already swiped by current user, not the current user
- Scenario compatibility: `looking_housing_roomie` matches `has_housing_seeking_roomie` (and vice versa); `looking_housing_roomie` also matches `looking_housing_roomie` (two people looking can find each other); `has_housing_seeking_roomie` matches `has_housing_seeking_roomie`; `squad` matches `squad`
- Sort: by lifestyle score descending (best matches first)
- Response: candidate profile data needed for swipe card (id, name, photos, vibe tags, budget, districts, scenario, lifestyle scales, matchScore)

### Swipe Endpoint
- **LOCKED**: `POST /swipes` with body `{ targetId: number, action: 'like' | 'pass' | 'super_like' }`
- Records a `Swipe` row
- If `action === 'like'` or `action === 'super_like'`: check if target already liked current user → if yes, create `Match` record (enforce `user1Id < user2Id` invariant)
- Returns: `{ matched: boolean, matchId?: number }`
- Hard filter: cannot swipe self, cannot re-swipe an already-swiped target (return 409 if exists)

### Frontend Wiring
- **LOCKED**: Replace `MOCK_PROFILES` in `SwipeDeck` with real data from `GET /feed`
- Add `POST /swipes` call on each swipe action in `SwipeDeck`
- Show a match screen (simple modal/overlay) when `matched: true` is returned
- Frontend types updated to match real API response shape

### Match Score Storage
- **LOCKED**: For `GET /feed`, compute score on-the-fly (not pre-computed) for Phase 2 MVP
- Only store match record after mutual like, not before

### Claude's Discretion
- Feed pagination (cursor or page) — implement if natural, skip if adds complexity
- Exact match screen UI (simple is fine — a text overlay saying "It's a match!" with candidate name)
- Error handling for edge cases (no candidates in city, all candidates swiped out)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema
- `roomies back/prisma/schema.prisma` — Full DB schema (User, Swipe, Match models are key)
- `roomies back/prisma/seed.ts` — Existing seed file to extend with fake profiles

### Existing Backend Patterns
- `roomies back/src/auth/` — JWT guard pattern (all /feed and /swipes must be guarded)
- `roomies back/src/onboarding/onboarding.service.ts` — Service pattern with PrismaService injection
- `roomies back/src/onboarding/onboarding.controller.ts` — Controller pattern with `@UseGuards(JwtAuthGuard)`

### Existing Frontend Patterns
- `front/features/onboarding/api/onboarding-api.ts` — API client pattern (typed fetch with auth header)
- `front/widgets/swipe-deck/` — SwipeDeck component consuming MOCK_PROFILES today
- `front/entities/profile/` — Profile type definitions and mock data to replace

### CLAUDE.md Rules
- `telegramId` is always BigInt — fake profiles must use BigInt telegramId values
- Match invariant: `user1Id < user2Id` must be enforced at app layer

</canonical_refs>

<specifics>
## Specific Ideas

- Fake users should cover a range of cities (mostly city 1 = Moscow from seed) so matches are possible
- Some fakes should have overlapping budgets with each other AND with real test users (budget range ~20k–80k RUB/month)
- Lifestyle scales on fakes should be spread across the 0–1 range to produce varied scores
- "It's a match!" screen: show both users' names and a "Начать общение" button (button can be placeholder in Phase 2)

</specifics>

<deferred>
## Deferred Ideas

- MATCH-04: Cosine similarity (VibeEmbedding) — Phase 3
- MATCH-05: Real-time behavioral signals — Phase 3
- MATCH-06/07/08/09: Full discovery UI with filters and match reasons — Phase 3
- Feed pagination — Phase 3
- Behavioral events on swipe (BehavioralEvent table write) — can be added as non-blocking bonus in Phase 2 if time allows
- "Who liked me" list — Phase 7

</deferred>

---

*Phase: 02-matching-engine*
*Context gathered: 2026-06-10 via pre-planning discussion*
