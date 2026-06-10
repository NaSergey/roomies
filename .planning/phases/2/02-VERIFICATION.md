---
phase: 02-matching-engine
verified: 2026-06-10T00:00:00Z
status: gaps_found
score: 7/11 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Vibe compatibility uses cosine similarity over the quiz embedding vector plus vibe tags"
    status: failed
    reason: "ROADMAP SC 3 requires vibe cosine similarity; vibeScore is stored as null in Match records and no embedding computation exists. MATCH-04 is listed as Phase 2 in REQUIREMENTS.md with status Pending."
    artifacts:
      - path: "roomies back/src/swipe/swipe.service.ts"
        issue: "vibeScore: null — no cosine similarity computation exists anywhere in Phase 2 code"
    missing:
      - "Vibe embedding computation (cosine similarity over quiz answer vector + vibe tags)"
      - "vibeScore populated when creating Match record"
  - truth: "User actions (like, message, reply, feedback) append BehavioralEvent rows that feed the behavioral component of future scores"
    status: failed
    reason: "ROADMAP SC 4 requires BehavioralEvent rows on user actions; POST /swipes does not write any BehavioralEvent row. behavioralScore is stored as null. MATCH-05 is listed as Phase 2 in REQUIREMENTS.md with status Pending."
    artifacts:
      - path: "roomies back/src/swipe/swipe.service.ts"
        issue: "createSwipe() does not write to BehavioralEvent table; behavioralScore: null in Match record"
    missing:
      - "BehavioralEvent.create() call in SwipeService after each like/super_like action"
      - "behavioralScore contribution to Match record (even as partial placeholder that reads BehavioralEvent count)"
  - truth: "Match Score breakdown stored as hardScore + lifestyleScore + vibeScore + behavioralScore per ROADMAP SC 1"
    status: failed
    reason: "Match record stores matchScore=0.5 (placeholder), hardScore=1.0, lifestyleScore=null, vibeScore=null, behavioralScore=null. The real lifestyleScore computed by FeedService is NOT written back to the Match record — only the placeholder 0.5 is stored. ROADMAP SC 1 requires stored breakdown with meaningful values."
    artifacts:
      - path: "roomies back/src/swipe/swipe.service.ts"
        issue: "match.create sets matchScore=0.5, lifestyleScore=null — real score computed in FeedService is not passed to SwipeService or stored in Match row"
    missing:
      - "lifestyleScore written to Match record (real value, not null)"
      - "matchScore in Match record reflecting actual computed score, not hardcoded 0.5"
deferred: []
---

# Phase 2: Matching Engine Verification Report

**Phase Goal:** Real matching pipeline — logged-in user with completed profile sees real candidates from DB in the swipe feed, can like/pass them, and gets a Match record created on mutual like.
**Verified:** 2026-06-10T00:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running seed produces 20–30 fake users with onboardingCompleted=true | VERIFIED | FAKE_USERS constant has exactly 25 entries with deterministic BigInt telegramIds, all upserted with onboardingCompleted=true, quizCompleted=true, isActive=true; integrity check `fakeCount < 20` throws on failure |
| 2 | Fake users cover varied scenarios (looking_housing_roomie and has_housing_seeking_roomie) | VERIFIED | 13 looking_housing_roomie + 10 has_housing_seeking_roomie + 2 looking_roomie_find_housing in FAKE_USERS constant |
| 3 | Fake users have non-null lifestyle scales (noiseLevel, cleanliness, sleepSchedule, socialLevel, workFromHome) | VERIFIED | All 25 entries have explicit decimal values in 0.00–1.00 range; upsert writes these as create+update fields |
| 4 | Seed is idempotent — running twice does not create duplicates | VERIFIED | All upserts use `where: { telegramId: fake.telegramId }`; districts/vibeTags use deleteMany+createMany; quiz answers use upsert by userId_questionId |
| 5 | GET /feed with valid JWT returns up to 20 candidate objects from DB | VERIFIED | FeedService.getFeed() loads candidates, filters, scores, sorts, slices top 20; FeedController @Get() @UseGuards(JwtAuthGuard) wired |
| 6 | Candidates excluded: same user, already swiped, different city, onboardingCompleted=false | VERIFIED | Query WHERE: id.not=userId, id.notIn=swipedIds, cityId=me.cityId??-1, onboardingCompleted=true, isActive=true |
| 7 | Hard-conflict candidates (budget non-overlap, smoking mismatch, pets mismatch) are excluded | VERIFIED | hasHardConflict() implements all three checks; .filter(c => !hasHardConflict(me, c)) applied before scoring |
| 8 | POST /swipes records a Swipe row and returns { matched: false } on first swipe | VERIFIED | SwipeService creates Swipe row, checks for reverseSwipe, returns { matched: false } when none found |
| 9 | POST /swipes returns { matched: true, matchId: N } when target already liked current user | VERIFIED | Looks for reverseSwipe with action in ['like','super_like']; if found creates Match and returns { matched: true, matchId: match.id } |
| 10 | Match record created with user1Id < user2Id (invariant enforced) | VERIFIED | Math.min(actorId, dto.targetId) → user1Id, Math.max → user2Id before every match.create |
| 11 | POST /swipes returns 409 if same actor+target pair already exists | VERIFIED | ConflictException thrown when `existing` swipe found; duplicate check precedes create |
| 12 | Squad scenario user only receives squad candidates | VERIFIED | Exhaustive Record<ScenarioType, ScenarioType[]> map — squad: ['squad'] in feed.service.ts |
| 13 | SwipeDeck loads real profiles from GET /feed on mount — MOCK_PROFILES no longer used | VERIFIED | SwipeDeck.tsx has no profiles prop; useEffect calls getFeed() on mount with cancel guard |
| 14 | Each swipe card action calls POST /swipes with correct action string | VERIFIED | handleSwipe maps direction='right'→'like', direction='left'→'pass'; calls postSwipe(currentProfile.id, action) |
| 15 | When POST /swipes returns matched:true, match overlay appears with candidate name and Начать общение button | VERIFIED | matchState set on result.matched; overlay renders "It's a match!", candidateName, Начать общение button that calls setMatchState(null) |
| 16 | When feed returns empty array, empty state renders without error | VERIFIED | isEmpty from useSwipeDeck drives EmptyState render; catch in useEffect sets profiles=[] |
| 17 | Match Score stored breakdown per ROADMAP SC 1 (hardScore, lifestyleScore, vibeScore, behavioralScore) | FAILED | Match record stores matchScore=0.5 (placeholder), hardScore=1.0, lifestyleScore=null, vibeScore=null, behavioralScore=null — real lifestyleScore computed in FeedService is never passed to SwipeService |
| 18 | Lifestyle score with penalty for large divergences (ROADMAP SC 3 first part) | VERIFIED | computeLifestyleScore: 1 - avg(|me.scale - candidate.scale|) over 5 scales; naturally penalizes large differences |
| 19 | Vibe compatibility uses cosine similarity over quiz embedding vector + vibe tags (ROADMAP SC 3 second part / MATCH-04) | FAILED | vibeScore=null in all Match records; no embedding or cosine similarity computation exists in Phase 2 code |
| 20 | User actions append BehavioralEvent rows (ROADMAP SC 4 / MATCH-05) | FAILED | POST /swipes does not write BehavioralEvent; no BehavioralEvent writes exist in any Phase 2 file |

**Score:** 17/20 truths — 3 FAILED (all from ROADMAP SCs 1/3/4 = MATCH-04, MATCH-05, and lifestyleScore persistence)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `roomies back/prisma/seed.ts` | seedFakeProfiles() function with 25 fake users | VERIFIED | 25 FAKE_USERS entries, seedFakeProfiles() called from main() after step 4 |
| `roomies back/src/feed/feed.service.ts` | FeedService with getFeed(userId) | VERIFIED | Injectable, PrismaService injected, 7-step pipeline, hasHardConflict, computeLifestyleScore |
| `roomies back/src/feed/feed.controller.ts` | GET /feed guarded by JwtAuthGuard | VERIFIED | @Get() @UseGuards(JwtAuthGuard) @CurrentUser() present |
| `roomies back/src/feed/feed.module.ts` | FeedModule importing AuthModule | VERIFIED | imports: [AuthModule], controllers/providers wired |
| `roomies back/src/swipe/swipe.service.ts` | SwipeService with createSwipe(actorId, dto) | VERIFIED | All guards present: self-swipe, duplicate 409, reverse swipe match creation |
| `roomies back/src/swipe/swipe.controller.ts` | POST /swipes guarded by JwtAuthGuard | VERIFIED | @Post() @UseGuards(JwtAuthGuard) @CurrentUser() present |
| `roomies back/src/swipe/swipe.module.ts` | SwipeModule | VERIFIED | imports: [AuthModule] |
| `roomies back/src/swipe/dto/create-swipe.dto.ts` | CreateSwipeDto with targetId + action enum | VERIFIED | IsInt/IsPositive on targetId, IsEnum(SwipeActionDto) on action |
| `roomies back/src/app.module.ts` | FeedModule and SwipeModule in imports | VERIFIED | Both FeedModule and SwipeModule present in AppModule imports array |
| `front/shared/lib/api/feed.ts` | getFeed() and postSwipe() API functions | VERIFIED | Both exported, import apiFetch from './client' (not barrel) |
| `front/entities/profile/model/types.ts` | RoomieProfile with matchScore and new API fields | VERIFIED | photos[], vibeTags, districts, lifestyleScales, matchScore, budgetMin/budgetMax |
| `front/entities/profile/index.ts` | Barrel without MOCK_PROFILES | VERIFIED | Only RoomieProfile type and ProfileCard exported |
| `front/entities/profile/ui/ProfileCard.tsx` | ProfileCard using photos[], vibeTags, budgetMin/budgetMax | VERIFIED | Uses photos[0], vibeTags.map(t=>t.label), budgetMin/budgetMax formatted, matchScore as pill |
| `front/widgets/swipe-deck/ui/SwipeDeck.tsx` | SwipeDeck with getFeed, postSwipe, match overlay | VERIFIED | No profiles prop, useEffect getFeed, handleSwipe calls postSwipe, matchState overlay |
| `front/widgets/home/ui/HomeView.tsx` | No MOCK_PROFILES reference, SwipeDeck with no props | VERIFIED | `<SwipeDeck />` with no props, no MOCK_PROFILES import |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| feed.controller.ts | feed.service.ts | constructor injection | VERIFIED | `constructor(private readonly feed: FeedService)` |
| swipe.service.ts | prisma.match.create | mutual like check | VERIFIED | reverseSwipe check → match.create with Math.min/Math.max |
| app.module.ts | FeedModule | imports array | VERIFIED | FeedModule in @Module imports |
| app.module.ts | SwipeModule | imports array | VERIFIED | SwipeModule in @Module imports |
| SwipeDeck.tsx | shared/lib/api/feed.ts | getFeed() in useEffect | VERIFIED | `import { getFeed, postSwipe } from '@/shared/lib/api'` |
| SwipeDeck.tsx | shared/lib/api/feed.ts | postSwipe() on swipe | VERIFIED | postSwipe(currentProfile.id, action) inside handleSwipe |
| shared/lib/api/feed.ts | shared/lib/api/client.ts | direct import (no circular) | VERIFIED | `import { apiFetch } from './client'` — not from barrel |
| shared/lib/api/index.ts | feed.ts | barrel export | VERIFIED | `export { getFeed, postSwipe, type FeedCandidate, type SwipeResult } from './feed'` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| SwipeDeck.tsx | profiles (useState) | getFeed() → GET /feed → FeedService.getFeed() → prisma.user.findMany | Yes — real DB query with scoring | FLOWING |
| FeedService.getFeed() | candidates | prisma.user.findMany with WHERE filters | Yes — real query with onboardingCompleted, cityId, scenario filters | FLOWING |
| SwipeService.createSwipe() | match record | prisma.match.create after reverseSwipe check | Yes — real DB write, but matchScore=0.5 placeholder and lifestyleScore=null | PARTIAL — match created but scores not real |
| ProfileCard.tsx | profile.photos[0], profile.vibeTags, profile.matchScore | RoomieProfile from SwipeDeck feed state | Yes — real API data flows through | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED for live API checks (no server running). Static analysis only — see artifact and wiring verification above.

---

### Probe Execution

Step 7c: No probe scripts declared in PLAN frontmatter. No `scripts/*/tests/probe-*.sh` files exist for Phase 2.

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MATCH-01 | 02-01, 02-02, 02-03 | System computes Match Score = Hard(35%) + Lifestyle(30%) + Vibe(25%) + Behavioral(10%) | PARTIAL | Hard filter + lifestyle proximity score implemented; Vibe (25%) and Behavioral (10%) components are null — full formula not achieved |
| MATCH-02 | 02-02 | Hard factor conflict → score=0, candidate excluded | SATISFIED | hasHardConflict() excludes on budget non-overlap, smoking mismatch, pets mismatch; different city excluded by DB query filter |
| MATCH-03 | 02-02 | Lifestyle compatibility from normalized 0–1 quiz scales with penalty for large divergences | SATISFIED | computeLifestyleScore: 1-avg(|me.scale-candidate.scale|) over 5 scales; penalty = large |diff| reduces score toward 0 |
| MATCH-04 | None of 02-01/02/03 | Vibe compatibility via cosine similarity of embedding vector + vibe tags | BLOCKED | Explicitly deferred by CONTEXT.md; vibeScore=null; MATCH-04 listed as Phase 2 in REQUIREMENTS.md |
| MATCH-05 | None of 02-01/02/03 | Behavioral signals from user actions update model in real time | BLOCKED | BehavioralEvent table exists in schema but SwipeService never writes to it; behavioralScore=null |

**Orphaned requirements:** MATCH-04 and MATCH-05 are listed as Phase 2 in REQUIREMENTS.md traceability table but are not covered by any Phase 2 plan and are not reallocated to a later phase in ROADMAP.md. Phase 3 ROADMAP requirements list is MATCH-06, MATCH-07, MATCH-08, MATCH-09, PROF-01 through PROF-04 — MATCH-04/05 appear nowhere in Phase 3+.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| roomies back/src/swipe/swipe.service.ts | 57 | `matchScore: 0.5` hardcoded | Warning | Match record stored with non-meaningful score; acknowledged in SUMMARY as "placeholder" |
| roomies back/src/swipe/swipe.service.ts | 58 | `lifestyleScore: null` | Warning | Real lifestyle score computed in FeedService but not passed to SwipeService for storage |
| roomies back/src/swipe/swipe.service.ts | 59-60 | `vibeScore: null, behavioralScore: null` | Info | Intentional per CONTEXT.md deferred decisions for MATCH-04/05 |

No TBD/FIXME/XXX markers found in any Phase 2 modified files.

---

### Human Verification Required

#### 1. Mutual Like Match Flow — End-to-End

**Test:** Seed DB, authenticate as fake user A (telegramId 1100000001, scenario looking_housing_roomie), call GET /feed, pick a candidate from has_housing_seeking_roomie, POST /swipes with action=like. Then authenticate as that candidate, POST /swipes targeting user A with action=like. Verify the second POST returns `{ matched: true, matchId: N }`.
**Expected:** Match record exists in DB with user1Id=min(A,B), user2Id=max(A,B), hardScore=1.0, matchScore=0.5.
**Why human:** Requires running server with DB, live JWT tokens for two different fake users.

#### 2. Squad Scenario Feed Isolation

**Test:** Create or use a user with scenario='squad'. Call GET /feed. Verify returned candidates only have scenario='squad'. Verify no looking_housing_roomie or has_housing_seeking_roomie candidates appear.
**Expected:** Only squad-scenario users returned.
**Why human:** Requires live DB with squad-scenario users seeded (current seed has 0 squad users — feed would return empty for squad users).

#### 3. SwipeDeck Real Feed Rendering

**Test:** Open app in browser as authenticated user with completed onboarding (cityId matching Moscow seed users). Observe SwipeDeck loading state (animated dots), then candidate cards appearing with matchScore pill, budget range, and vibe tags.
**Expected:** Loading dots visible briefly, then real candidate cards from DB appear, each showing "XX% match" pill, budget range, and up to 3 vibe tag chips.
**Why human:** Requires running browser, Telegram Mini App environment.

---

### Gaps Summary

Three gaps block full ROADMAP goal achievement for Phase 2:

**Gap 1 — Stored Match Score is a placeholder (ROADMAP SC 1 partial):** The `Match` record created on mutual like stores `matchScore=0.5` (hardcoded) and `lifestyleScore=null`. The real lifestyle proximity score is computed on-the-fly in `FeedService` but is never passed to `SwipeService`. This means mutual-match records don't reflect the actual compatibility score. The match is correctly created (user1Id < user2Id enforced), but the score fields are meaningless.

**Gap 2 — No vibe scoring (MATCH-04 / ROADMAP SC 3b):** The vibe component (25% of total Match Score per MATCH-01) requires cosine similarity over the quiz answer embedding vector plus vibe tags. This is not implemented — `vibeScore=null` in all records. MATCH-04 is listed as Phase 2 in REQUIREMENTS.md traceability but is not deferred to any named later phase in ROADMAP.md.

**Gap 3 — No behavioral signals (MATCH-05 / ROADMAP SC 4):** `BehavioralEvent` table exists in schema and is ready, but `SwipeService.createSwipe()` never writes to it. No behavioral component is collected. MATCH-05 is listed as Phase 2 in REQUIREMENTS.md traceability but is not deferred to any named later phase in ROADMAP.md.

**Mitigating context:** The CONTEXT.md pre-planning document explicitly deferred MATCH-04 and MATCH-05 to "Phase 3+" by mutual agreement with the user before planning began. The PLANS themselves only claim MATCH-01, MATCH-02, MATCH-03 in their frontmatter `requirements:` fields. The user story goal stated in CONTEXT.md ("sees real candidates from DB in the swipe feed, can like/pass them, and gets a Match record created on mutual like") is fully achieved. The gaps are against the full ROADMAP Phase 2 success criteria which include MATCH-04 and MATCH-05.

**What IS fully working:**
- 25 fake profiles seeded with real lifestyle scales, quiz answers, districts, vibe tags
- GET /feed returns real scored candidates with hard filtering and lifestyle proximity sort
- POST /swipes records swipes, creates Match on mutual like with user1Id < user2Id
- 409 on duplicate swipes
- Squad scenario isolation in feed
- Frontend SwipeDeck loads real feed data, calls postSwipe on each action, shows match overlay
- ProfileCard uses real API field shapes, MOCK_PROFILES removed from all production code paths
- TypeScript compiles clean in both front and back

---

_Verified: 2026-06-10T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
