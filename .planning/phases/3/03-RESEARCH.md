# Phase 3: Discovery & Profiles — Research

**Researched:** 2026-06-22
**Domain:** Feed filtering / candidate profile sheet / own profile editing / Roomie Score / swipe actions extension
**Confidence:** HIGH — all findings verified directly from source code in this session

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 LOCKED:** Tapping anywhere on a swipe card opens the candidate's detail profile.
- **D-02 LOCKED:** Profile renders in a **bottom sheet** that slides up from below. The swipe deck remains visible behind the sheet. Closing the sheet (drag-down or back gesture) returns to the swipe deck.
- **D-03 LOCKED:** The bottom sheet contains **Like + Pass action buttons** at the bottom. Tapping either performs the swipe action (calls `POST /swipes`) and dismisses the sheet.
- **D-04 LOCKED:** Section "Вайб дома" shows the 5 Vibe Quiz lifestyle scales (noiseLevel, cleanliness, sleepSchedule, socialLevel, workFromHome) as visual indicators. Values come from the candidate's profile fields.
- **D-05 LOCKED:** Section "Правила, которые важны" shows hard dealbreakers: smokingOk, petsOk, guestsPref.
- **D-06 LOCKED:** Section "О себе" shows: name, age, budget range, move-in date, scenario, city + districts, and vibe tags.
- **D-07 LOCKED:** Section "Почему вы совпали" shows 2–3 reasons generated **by the backend** as ready-to-display text strings. `GET /feed` returns `matchReasons: string[]`. Frontend renders them directly.
- **D-08 LOCKED:** If a soft risk exists, the backend includes it in `matchRisks: string[]` (1 item max in Phase 3 MVP).
- **D-09 LOCKED:** Swipe cards show a **single overall Match Score %** ("★ 87%"). Breakdown components shown only inside the candidate profile sheet.
- **D-10 (Claude's Discretion):** Wire the existing FilterSheet filters to `GET /feed` query params. Apply on "Применить" button tap. Invalidate/refetch `['feed']` on filter apply.
- **D-11 (Claude's Discretion):** The `DeckFilters` type maps to query string params — planner decides the exact param names.
- **D-12 (Claude's Discretion):** `ProfileView` (existing stub) becomes the own profile screen. Planner decides inline-edit vs. separate edit mode.
- **D-13:** Photo upload to S3/R2 deferred. URL-input fallback is acceptable for MVP.
- **D-14 (Claude's Discretion):** Show Roomie Score as numeric value + progress bar on own profile. Backend computes the score.

### Claude's Discretion

- Exact layout/order of sections in the candidate bottom sheet
- Animation style for the bottom sheet (slide-up, spring vs ease)
- Whether "Boost" button in DeckToolbar does anything in Phase 3 (leave as UI-only toggle, no backend — Phase 7)
- Whether `GET /feed` supports pagination in Phase 3 (not needed yet, 20 results is enough)
- Exact Roomie Score formula implementation

### Deferred Ideas (OUT OF SCOPE)

- Boost backend — Phase 7 (MONET-01)
- MATCH-04: Cosine similarity via VibeEmbedding / pgvector
- MATCH-05: Real-time behavioral signals
- Feed pagination
- Photo upload to S3 — MVP: URL input
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MATCH-06 | Пользователь видит ленту карточек с % совместимости и 2–3 причинами мэтча | Backend: add `matchReasons[]` to `GET /feed` response; frontend: ProfileCard badge update + CandidateProfileSheet |
| MATCH-07 | Пользователь может свайпнуть «в вайб» (лайк), «сохранить», «супер мэтч», «не моё» (пасс) | Swipe schema already has all 4 actions (like, save, super_like, pass). Frontend ActionButtons currently has 2 actions — extend to 4. SwipeActionDto missing `save` |
| MATCH-08 | При взаимном лайке показывается экран мэтча с причинами совпадения | Match overlay already exists in SwipeDeck. Extend to show `matchReasons` from the feed data (already in profile state) |
| MATCH-09 | Пользователь может открыть фильтры и настроить параметры поиска | FilterSheet UI exists, local only. Wire `DeckFilters` → `GET /feed` query params via `useFeedQuery(params)` |
| PROF-01 | Пользователь может редактировать профиль: фото, имя, вайб-теги, dealbreakers, бюджет, районы | Backend: new `PATCH /profile` endpoint (or reuse/extend onboarding endpoints). Frontend: ProfileEditSheet (new), ProfileView (replace stub) |
| PROF-02 | Детальный профиль кандидата содержит секции: «Вайб дома», «Правила, которые важны», «О себе», «Почему вы совпали» | New CandidateProfileSheet widget. All data already returned by `GET /feed` except `matchReasons`, `matchRisks`, `guestsPref`, `smokingOk`, `petsOk` (need backend additions) |
| PROF-03 | Блок «Почему вы совпали» показывает 2–3 причины совпадения и мягкий риск (если есть) | Backend generates template-based matchReasons from lifestyle scale diffs + dealbreaker matches |
| PROF-04 | Roomie Score отображается в профиле с объяснением как его улучшить | New `GET /profile/me` endpoint returning user data + roomieScore. Frontend: RoomieScoreCard component |
</phase_requirements>

---

## Summary

Phase 3 builds on a solid foundation laid in Phase 2: the backend `GET /feed` already computes `matchScore` from lifestyle scales and hard SQL filters, and the frontend has a working swipe deck with React Query, a FilterSheet UI (with local state only), and ProfileCard with neobrutalist design. The uncommitted work document is accurate and complete — nothing was missed in the working tree.

The key gaps to close are: (1) backend must add `matchReasons`, `matchRisks`, `guestsPref`, `smokingOk`, `petsOk` to the feed response, (2) backend must accept optional filter query params on `GET /feed`, (3) frontend must wire `DeckFilters` → `useFeedQuery(params)`, (4) a new `CandidateProfileSheet` widget must be built, (5) a new `ProfileView` must replace the stub, (6) a new `GET /profile/me` endpoint is needed, (7) a new `PATCH /profile` endpoint is needed for editing. The `SwipeActionDto` on the backend is missing `save` action (schema has it, DTO does not). `ActionButtons` currently has 3 buttons (pass, message, like) — the message button is vestigial; Phase 3 adds save/super_like only in the CandidateProfileSheet context.

**Primary recommendation:** Build in this order — backend feed extension → backend profile endpoints → frontend filter wiring → CandidateProfileSheet → ProfileView. Don't touch ChatView.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| matchReasons generation | API / Backend | — | Requires access to both users' lifestyle scales — cannot be done client-side |
| Feed filtering (budget, districts, dealbreakers) | API / Backend | Frontend (queryKey) | Hard filters must be SQL-level for correctness (established pattern in feed.service.ts) |
| Candidate profile display | Frontend (widgets) | — | Read-only display of data returned by API |
| Bottom sheet animation | Browser / Client | — | CSS transform, no backend involvement |
| Own profile editing | API / Backend + Frontend | — | PATCH /profile writes to DB; frontend owns form state |
| Roomie Score computation | API / Backend | — | Computed from DB fields (photos, quiz, dealbreakers, phone) |
| Roomie Score display | Frontend (widgets) | — | Read-only rendering of `roomieScore` from `GET /profile/me` |
| Swipe actions (save/super_like) | API / Backend + Frontend | — | Schema exists, DTO incomplete, frontend buttons absent |

---

## Standard Stack

No new packages required. All necessary libraries are already installed.

### Core (already installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@tanstack/react-query` | in package.json | Server state, feed caching, invalidation | Active — `shared/lib/query/` set up, `useFeedQuery` in use |
| `next` | 16 | Framework, App Router | Active |
| `tailwindcss` | v4 | Styling, neobrutalism tokens | Active — no config file, CSS vars in globals.css |
| `@nestjs/*` | 11 | Backend modules | Active |
| `@prisma/client` | 7 | DB access | Active — schema fully defined |
| `class-validator` | installed | DTO validation | Active — all backend DTOs use it |

### No New Packages Needed

All Phase 3 capabilities can be implemented with what is already installed:
- Bottom sheets: pure CSS transform (FilterSheet pattern)
- Drag-to-dismiss: pointer event handlers (SwipeCard pattern)
- Progress bars: CSS width transition (no library)
- Form state: `useState` in sheet components
- API calls: existing `apiFetch` in `shared/lib/api/client.ts`

**Installation:** None required.

---

## Package Legitimacy Audit

No new packages are introduced in Phase 3. Section not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
Telegram WebApp
    │
    ▼
HomeView (views/home) ── MainShell state (tab: cards | profile | chat)
    │                               │
    ├── SwipeDeck (widgets/swipe-deck)        ProfileView (widgets/profile)
    │       │                                      │
    │       ├── DeckToolbar ──► onOpenFilters       ├── RoomieScoreCard
    │       ├── FilterSheet ──► onApply(filters)    ├── VibeScaleBar (x5, read-only)
    │       ├── SwipeCard(s)                        ├── RulesSection (read-only)
    │       │     └──► onCardTap                    └── ProfileEditSheet (bottom sheet)
    │       │               │
    │       │               ▼
    │       │     CandidateProfileSheet (widget/candidate-profile)
    │       │             ├── VibeScaleBar (x5)
    │       │             ├── RulesSection
    │       │             ├── MatchReasonsList
    │       │             └── ActionButtons (Like / Pass)
    │       │                     │
    │       │            POST /swipes
    │       │
    │       └── useFeedQuery(filters) ──────────► GET /feed?budgetMin=&districtIds[]=...
    │                                                        │
    │                                               FeedService.getFeed(userId, filters)
    │                                                        │
    │                                               SQL WHERE + JS scoring
    │                                                        │
    │                                               response: [...candidate + matchReasons + matchRisks]
    │
    └── useProfileQuery() ────────────────────► GET /profile/me
                                                         │
                                                ProfileService.getMe(userId)
                                                         │
                                                User + photos + districts + vibeTags + roomieScore

PATCH /profile ◄── ProfileEditSheet save
     │
ProfileService.updateProfile(userId, dto)
```

### Recommended Project Structure (additions only)

```
front/
├── widgets/
│   ├── candidate-profile/         # NEW widget slice
│   │   ├── ui/
│   │   │   ├── CandidateProfileSheet.tsx
│   │   │   ├── VibeScaleBar.tsx
│   │   │   ├── MatchReasonsList.tsx
│   │   │   └── RulesSection.tsx
│   │   └── index.ts
│   └── profile/
│       └── ui/
│           ├── ProfileView.tsx    # REPLACE stub
│           ├── RoomieScoreCard.tsx  # NEW
│           └── ProfileEditSheet.tsx # NEW
├── features/
│   └── swipe-profile/
│       └── model/
│           └── use-feed-query.ts  # EXTEND: accept FeedQueryParams
├── shared/
│   └── lib/
│       └── api/
│           ├── feed.ts            # EXTEND: getFeed(params?), add matchReasons to FeedCandidate
│           └── profile.ts         # NEW: getMe(), patchProfile(dto)

roomies back/src/
├── feed/
│   ├── feed.service.ts            # EXTEND: add filter params + matchReasons generation
│   ├── feed.controller.ts         # EXTEND: accept @Query() params
│   └── dto/
│       └── feed-query.dto.ts      # NEW
├── profile/                       # NEW module
│   ├── profile.module.ts
│   ├── profile.controller.ts      # GET /profile/me, PATCH /profile
│   ├── profile.service.ts
│   └── dto/
│       └── update-profile.dto.ts
└── swipe/
    └── dto/
        └── create-swipe.dto.ts    # EXTEND: add 'save' to SwipeActionDto enum
```

### Pattern 1: Extending useFeedQuery with filter params

**What:** `useFeedQuery` currently has no params. Extend to accept `FeedQueryParams` object that maps to URL query string.

**When to use:** When filter state changes and user taps "Применить".

```typescript
// Source: front/features/swipe-profile/model/use-feed-query.ts (verified from codebase)
export const feedKeys = {
  all: ['feed'] as const,
  filtered: (params: FeedQueryParams) => ['feed', params] as const,
};

export function useFeedQuery(params?: FeedQueryParams) {
  return useQuery({
    queryKey: params ? feedKeys.filtered(params) : feedKeys.all,
    queryFn: () => getFeed(params),
    staleTime: 5 * 60 * 1000,
  });
}
```

SwipeDeck holds `queryParams` state; on filter apply, sets new params → React Query sees new queryKey → refetch.

### Pattern 2: matchReasons generation (backend)

**What:** Template-based string generation from lifestyle scale diffs and dealbreaker matches.

**When to use:** Inside `FeedService.getFeed()` Step 7 (map to response shape).

```typescript
// Source: derived from feed.service.ts computeLifestyleScore pattern [ASSUMED template, logic is new]
function generateMatchReasons(me: UserScoreFields, candidate: UserScoreFields): string[] {
  const reasons: string[] = [];

  // Lifestyle scale proximity checks (diff < 0.2 = close enough to mention)
  if (me.sleepSchedule != null && candidate.sleepSchedule != null
      && Math.abs(Number(me.sleepSchedule) - Number(candidate.sleepSchedule)) < 0.2) {
    reasons.push('Похожий режим сна');
  }
  if (me.noiseLevel != null && candidate.noiseLevel != null
      && Math.abs(Number(me.noiseLevel) - Number(candidate.noiseLevel)) < 0.2) {
    reasons.push('Оба любят тишину дома');
  }
  if (me.cleanliness != null && candidate.cleanliness != null
      && Math.abs(Number(me.cleanliness) - Number(candidate.cleanliness)) < 0.2) {
    reasons.push('Одинаковый подход к чистоте');
  }

  // Dealbreaker alignment (both same value)
  if (!me.smokingOk && !candidate.smokingOk) reasons.push('Оба не курят');
  if (me.petsOk && candidate.petsOk) reasons.push('Оба любят питомцев');

  return reasons.slice(0, 3); // D-07: 2-3 reasons max
}

function generateMatchRisks(me: UserScoreFields & { budgetMin: number | null; budgetMax: number | null },
                             candidate: UserScoreFields & { budgetMin: number | null; budgetMax: number | null }): string[] {
  // Soft risk: budget overlap exists but is tight
  // Phase 3 MVP: 1 risk max (D-08)
  const risks: string[] = [];
  // ... budget gap logic
  return risks.slice(0, 1);
}
```

### Pattern 3: Bottom sheet (CandidateProfileSheet)

**What:** Slide-up bottom sheet over the swipe deck. Reuses the exact CSS pattern from FilterSheet.

**When to use:** On card tap (`onCardTap` prop on SwipeDeck/SwipeCard).

```typescript
// Source: FilterSheet.tsx container classes (verified from codebase)
// Container:
// fixed inset-x-0 bottom-0 z-50
// flex flex-col max-h-[92dvh]
// rounded-t-3xl border-t-2 border-black bg-white
// shadow-[0_-4px_0_rgba(20,20,15,0.9)]
// transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]
// open: translate-y-0  closed: translate-y-full

// Backdrop (z-40, below sheet z-50):
// fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
// transition-opacity duration-300
```

Drag-to-dismiss: track pointer delta in `onPointerMove` on the handle/top area. If delta-y > 100px on `onPointerUp`, trigger close. Snap back if < 100px (spring easing).

### Pattern 4: Tap detection on SwipeCard (not a drag)

**What:** Distinguish a tap from a drag on SwipeCard (pointer delta < 10px = tap).

**When to use:** `onCardTap` prop on SwipeCard / SwipeDeck.

```typescript
// Source: derived from SwipeCard.tsx drag pattern [ASSUMED — drag code is imperative refs]
// In SwipeCard onPointerDown: record startX, startY.
// In SwipeCard onPointerUp: if Math.hypot(dx, dy) < 10 → call onCardTap() instead of swipe.
// The existing lockRef (useSwipeDeck) prevents double-trigger.
```

### Pattern 5: Profile editing — PATCH /profile endpoint

**What:** New NestJS endpoint that reuses the onboarding service pattern. Lives in a new `ProfileModule`.

**When to use:** When user saves edits in ProfileEditSheet.

```typescript
// Source: onboarding.controller.ts + onboarding.service.ts patterns (verified from codebase)
// ProfileController follows the exact same pattern:
// @Patch()
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
// updateProfile(@CurrentUser() user: { id: number }, @Body() dto: UpdateProfileDto) {
//   return this.profile.updateProfile(user.id, dto);
// }

// UpdateProfileDto fields (superset of ProfileDto):
// name?: string
// photoUrls?: string[]
// vibeTagIds?: number[]
// budgetMin?: number
// budgetMax?: number
// districtIds?: number[]
// smokingOk?: boolean
// petsOk?: boolean
// guestsPref?: 'rarely' | 'sometimes' | 'often'
// All @IsOptional()
```

### Pattern 6: Roomie Score computation

**What:** `User.roomieScore` field (Int, default 0) already exists in schema. Compute and update on profile changes.

**Current state:** roomieScore is stored in DB but nothing computes it yet (it's 0 for all users).

**Scoring formula (PROF-04 requirement):**

```typescript
// Source: REQUIREMENTS.md PROF-04, 03-CONTEXT.md D-14
// +10 if user has at least 1 photo
// +10 if quizCompleted = true
// +10 if smokingOk, petsOk, guestsPref have been set (dealbreakers step completed, onboardingStep >= 4)
// +10 if isPhoneVerified = true (Phase 6 — will be 0 for all users in Phase 3)
// Max = 40 in Phase 3 (phone verification not available)

function computeRoomieScore(user: {
  photos: { url: string }[];
  quizCompleted: boolean;
  onboardingStep: number;
  isPhoneVerified: boolean;
}): number {
  let score = 0;
  if (user.photos.length > 0) score += 10;
  if (user.quizCompleted) score += 10;
  if (user.onboardingStep >= 4) score += 10; // dealbreakers set
  if (user.isPhoneVerified) score += 10;
  return score;
}
```

Score should be computed and saved: (a) on `GET /profile/me` (compute live, return in response), or (b) update `roomieScore` field on profile save. Option (a) is simpler and avoids stale data.

### Anti-Patterns to Avoid

- **Touching ChatView:** `widgets/chat/ui/ChatView.tsx` is a stub for Phase 4. Do not modify.
- **Deep imports across FSD slices:** `CandidateProfileSheet` in `widgets/candidate-profile/` must import `ActionButtons` via `@/features/swipe-profile` barrel (index.ts), not directly from the UI file.
- **Modifying SwipeDeck's core swipe logic:** The imperative drag system is performance-sensitive. Only add `onCardTap` prop; don't refactor the drag mechanics.
- **Generating matchReasons on the frontend:** D-07 is locked — backend generates, frontend renders strings.
- **Using `number` for telegramId anywhere:** CLAUDE.md rule, reinforced throughout codebase.
- **Forgetting to add `save` to SwipeActionDto:** Schema has `save` enum value, DTO enum (`SwipeActionDto`) is missing it. Without this, `POST /swipes` with `action: 'save'` will fail class-validator validation.
- **Invalidating without new queryKey:** After filter apply, the queryKey must change (include params) so React Query actually refetches. `queryClient.invalidateQueries({ queryKey: ['feed'] })` alone won't help if the query is `['feed', params]`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet | Custom CSS modal from scratch | FilterSheet.tsx pattern (copy container + backdrop classes) | Already tuned for TG WebApp, spring easing, backdrop-blur |
| API fetch with auth | Manual fetch + headers | `apiFetch` from `shared/lib/api/client.ts` | Handles Bearer token injection, JSON serialization, error throwing |
| Feed caching / stale | Manual useState + useEffect | `useFeedQuery` + React Query | Already set up with 5min staleTime, retry:1, window focus off |
| DTO validation | Manual if-checks | `class-validator` decorators on NestJS DTOs | Global ValidationPipe already configured in main.ts |
| Drag gesture on sheet | `react-draggable` or similar | Pointer event handlers (SwipeCard pattern) | No new dependencies; same pattern already in codebase |
| Progress bars | UI library component | CSS `width` + `transition-all duration-700` | Tailwind v4, no config file |

**Key insight:** The codebase has intentionally avoided UI libraries. Everything uses Tailwind v4 + CSS. Adding any component library (shadcn, radix, etc.) would conflict with the neobrutalism system and require significant adaptation.

---

## Detailed Findings by Research Area

### 1. Uncommitted Work Inventory — Exact Status

**[VERIFIED: direct file read]**

| Item | What Exists | What's Missing |
|------|-------------|----------------|
| FilterSheet.tsx | Full UI with Age/Schedule/Cleanliness/Budget filters; local state only; "Показать результаты" button calls `onClose()` | `onApply` callback; District/dealbreaker filter rows; filter → API wiring |
| DeckFilters type | `{ age, schedule, cleanliness, budget }` — 4 fields | `districtIds`, `smokingOk`, `petsOk`, `guestsPref` |
| ProfileCard.tsx | Shows `matchScore * 100` as a badge (via `GradientBackground`); shows 3 lifestyle score stickers | Badge format should change to "★ N%" and remove the 3 stickers (per D-09) |
| useFeedQuery | Exists, no params, queryKey `['feed']` | Needs params argument; queryKey should include params |
| ProfileView | Stub only (placeholder text) | Full implementation needed |
| ChatView | Stub only | Do NOT touch — Phase 4 |
| React Query client | `shared/lib/query/client.ts` — fully configured | Nothing missing |
| BottomNav | Fully built | Not scope of Phase 3 (already done) |
| DeckToolbar | Fully built | Boost stays UI-only |
| SwipeDeck | Wired to useFeedQuery, has filter state, shows matchState overlay | `onCardTap` for opening profile sheet |
| ActionButtons | 3 buttons: pass / message (disabled) / like | Phase 3 needs save + super_like in CandidateProfileSheet context |

### 2. Backend — feed.service.ts Analysis

**[VERIFIED: direct file read]**

`getFeed(userId: number)` currently:
- Step 1: Load current user (lifestyle scales, budget, smoking, pets, scenario, city)
- Step 2: Load already-swiped user IDs (exclude from candidates)
- Step 3: Scenario compatibility map (exhaustive `Record<ScenarioType, ScenarioType[]>`)
- Step 4: SQL WHERE with hard filters: `smokingOk: me.smokingOk`, `petsOk: me.petsOk`, budget overlap, same city, scenario match, `onboardingCompleted: true`, `isActive: true`
- Step 5: JS filter `hasHardConflict()` + compute lifestyle score per candidate
- Step 6: Sort desc by score, take top 20
- Step 7: Map to response: `{ id, name, age, scenario, budgetMin, budgetMax, photos, vibeTags, districts, lifestyleScales, matchScore }`

**What the response DOES NOT include (Phase 3 needs):**
- `matchReasons: string[]` — NEW, backend generates
- `matchRisks: string[]` — NEW, backend generates
- `smokingOk: boolean` — needed for RulesSection in CandidateProfileSheet
- `petsOk: boolean` — needed for RulesSection
- `guestsPref: GuestsPreference` — needed for RulesSection

**What filter params are NOT accepted yet:**
- `budgetMin`, `budgetMax` override (user can filter by different budget than profile)
- `districtIds[]` — filter candidates by district
- `smokingOk`, `petsOk`, `guestsPref` — override dealbreaker filters

The existing SQL filter always uses `me.smokingOk` and `me.petsOk`. Phase 3 should keep this as default but allow query param override.

**Controller:**
```typescript
// Currently: getFeed(@CurrentUser() user: { id: number })
// Phase 3: getFeed(@CurrentUser() user: { id: number }, @Query() query: FeedQueryDto)
```

### 3. Backend — Profile Editing

**[VERIFIED: direct file read]**

No `ProfileModule` or `PATCH /profile` exists. The `OnboardingModule` has `PATCH /onboarding/profile` which handles name, photoUrls, vibeTagIds (step 5 of onboarding).

**Decision:** Create a new `ProfileModule` with:
- `GET /profile/me` — returns full user profile + computed roomieScore
- `PATCH /profile` — edits name, photoUrls, vibeTagIds, budgetMin, budgetMax, districtIds, smokingOk, petsOk, guestsPref

The new `PATCH /profile` differs from `PATCH /onboarding/profile` in that:
- All fields are optional (not just photoUrls)
- Does NOT set `onboardingCompleted` or `onboardingStep`
- Covers more fields (budget, districts, dealbreakers)

The new `GET /profile/me` returns more than `GET /onboarding/status` — it includes photos (URLs), district names, vibe tag labels, and computed roomieScore.

### 4. Backend — matchReasons Generation

**[VERIFIED: schema + feed.service.ts read]**

Both users' lifestyle scales are available in memory during `FeedService.getFeed()` — `me` object (loaded in Step 1) and each `candidate` in the scored array. All 5 scales (noiseLevel, cleanliness, sleepSchedule, socialLevel, workFromHome) are `Decimal(3,2)` 0.0–1.0.

Template-based approach (no pgvector needed in Phase 3):

**Triggers for reasons (threshold diff < 0.2 on scale 0–1):**
- `sleepSchedule` close → "Похожий режим сна"
- `noiseLevel` close (both low) → "Оба любят тишину дома"
- `noiseLevel` close (both high) → "Оба любят активную обстановку"
- `cleanliness` close → "Одинаковый подход к чистоте"
- `socialLevel` close → "Схожий уровень общительности"
- `workFromHome` close → "Похожий режим работы"
- `smokingOk` both false → "Оба не курят"
- `petsOk` both true → "Оба любят питомцев"
- `guestsPref` same → "Одинаковое отношение к гостям"

**Triggers for risks (soft mismatches):**
- budget ranges overlap but one endpoint is far → "Разный уровень бюджета — уточните при знакомстве"
- `guestsPref` mismatch (one rarely, one often) → "Разное отношение к гостям"

**Implementation location:** Inside `FeedService.getFeed()` Step 7, or as a private method `generateMatchReasons(me, candidate)`.

**Important:** matchReasons are computed on-the-fly from in-memory data, NOT stored to `Match.matchReasons`. The Match table's `matchReasons` field exists but will remain unused in Phase 3 (it stores match analysis post-mutual-like, not feed analysis pre-swipe).

### 5. Frontend FSD Structure

**[VERIFIED: direct file read + ARCHITECTURE.md]**

FSD layer rules (verified from ARCHITECTURE.md):
- `widgets/` may import from `features/`, `entities/`, `shared/`
- `features/` may import from `entities/`, `shared/`
- `entities/` may import from `shared/` only
- Cross-slice via `index.ts` barrel only

**Placement decisions:**

| Component | Layer | Slice | Rationale |
|-----------|-------|-------|-----------|
| `CandidateProfileSheet` | `widgets/` | `candidate-profile/` | Composite: combines ActionButtons (feature) + VibeScaleBar/RulesSection/MatchReasonsList (new UI) |
| `VibeScaleBar` | `widgets/candidate-profile/ui/` | inside candidate-profile slice | Presentational, only used by CandidateProfileSheet and ProfileView; not shared enough for entities/ or shared/ |
| `RulesSection` | `widgets/candidate-profile/ui/` | inside candidate-profile slice | Same reasoning as VibeScaleBar |
| `MatchReasonsList` | `widgets/candidate-profile/ui/` | inside candidate-profile slice | Same |
| `ProfileEditSheet` | `widgets/profile/ui/` | inside profile slice | Uses profile data from GET /profile/me; tightly coupled to ProfileView |
| `RoomieScoreCard` | `widgets/profile/ui/` | inside profile slice | Only used in ProfileView |
| Profile API hooks | `features/profile/model/` | `profile/` feature | User actions (save profile) + data query |
| `useProfileQuery`, `usePatchProfile` | `features/profile/model/use-profile-query.ts` | `features/profile/` | Follows useFeedQuery pattern |

**Note on VibeScaleBar reuse:** Both `CandidateProfileSheet` and `ProfileView` need VibeScaleBar. Since both are in `widgets/`, placing VibeScaleBar inside one widget and importing from another would violate the "widgets don't import from widgets" rule. Best solution: place VibeScaleBar in `shared/ui/` or in a shared location, OR accept it in both widgets as a duplicated component (simpler). Given the UI spec explicitly places it under `widgets/candidate-profile/`, the planner should consider extracting it to `shared/ui/` for reuse. ProfileView can import VibeScaleBar from `@/widgets/candidate-profile` only if allowed — but widgets can't import from widgets. Therefore: move VibeScaleBar + RulesSection to `shared/ui/vibe/` or duplicate them.

**Recommended resolution:** Place `VibeScaleBar` and `RulesSection` in `shared/ui/` (they are pure presentational components with no widget-level coupling). Both `CandidateProfileSheet` and `ProfileView` then import from `@/shared`.

### 6. React Query Patterns

**[VERIFIED: direct file read]**

Current setup:
- `queryClient` in `shared/lib/query/client.ts`: `staleTime: 5min, retry: 1, refetchOnWindowFocus: false`
- `feedKeys.all = ['feed']`
- `useFeedQuery()`: no params, queryKey `['feed']`
- `useSwipeMutation()`: invalidates `['feed']` queryKey on `like` action only

**Phase 3 changes needed:**

```typescript
// Pattern for parameterized feed query:
export const feedKeys = {
  all: ['feed'] as const,
  filtered: (params: FeedQueryParams) => ['feed', params] as const,
};

// SwipeDeck state:
const [queryParams, setQueryParams] = useState<FeedQueryParams>({});
const { data: profiles } = useFeedQuery(queryParams);

// On filter apply:
const handleApplyFilters = useCallback((filters: DeckFilters) => {
  const params = filtersToQueryParams(filters); // convert DeckFilters → FeedQueryParams
  setQueryParams(params);
  setFilterOpen(false);
  // React Query auto-refetches because queryKey changes
}, []);
```

**Invalidation on swipe:** Currently invalidates on `like` only. Phase 3 should also invalidate on `super_like` (and possibly `save`). Pass does not need invalidation (user just moves to next card, no need to refetch).

**Profile query (new):**
```typescript
// features/profile/model/use-profile-query.ts
export const profileKeys = {
  me: ['profile', 'me'] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: getMe,
    staleTime: Infinity, // profile rarely changes; invalidate on save
  });
}

export function usePatchProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.me }),
  });
}
```

### 7. Prisma Schema — Confirmed Fields

**[VERIFIED: direct schema read]**

**User model — all fields confirmed:**
- `noiseLevel Decimal? @db.Decimal(3, 2)` — 0.0–1.0
- `cleanliness Decimal? @db.Decimal(3, 2)`
- `sleepSchedule Decimal? @db.Decimal(3, 2)`
- `socialLevel Decimal? @db.Decimal(3, 2)`
- `workFromHome Decimal? @db.Decimal(3, 2)`
- `smokingOk Boolean @default(false)`
- `petsOk Boolean @default(false)`
- `guestsPref GuestsPreference @default(sometimes)` — enum: `rarely | sometimes | often`
- `roomieScore Int @default(0)` — NOT Float, is Int
- `isPhoneVerified Boolean @default(false)`
- `quizCompleted Boolean @default(false)`
- `onboardingStep Int @default(0)`
- `telegramId BigInt @unique` — BigInt rule applies

**Match model — confirmed:**
- `matchScore Decimal @db.Decimal(5, 4)` — stored as 0.5 placeholder (real score computed on-the-fly in feed)
- `matchReasons Json?` — can store `[{ code: string, text: string }]` or `string[]`
- `matchRisks Json?`

**SwipeAction enum — confirmed:**
```prisma
enum SwipeAction {
  like
  super_like
  save
  pass
}
```

All 4 actions exist in the Prisma schema. The `SwipeActionDto` enum on the backend has only `like, pass, super_like` — missing `save`.

### 8. Swipe Actions — MATCH-07

**[VERIFIED: direct file read]**

**Schema:** `SwipeAction` enum has: `like`, `super_like`, `save`, `pass`. All correct.

**`SwipeService.createSwipe()`:** Handles mutual like detection for `like` AND `super_like`. `save` and `pass` create a Swipe record but do NOT create a Match.

**`SwipeActionDto` (backend DTO):**
```typescript
// Current (MISSING 'save'):
export enum SwipeActionDto {
  like = 'like',
  pass = 'pass',
  super_like = 'super_like',
}
```
Fix: add `save = 'save'` to the enum.

**Frontend `postSwipe` function:**
```typescript
// Current signature allows 'super_like' but not 'save':
export function postSwipe(targetId: number, action: 'like' | 'pass' | 'super_like'): Promise<SwipeResult>
```
Fix: add `| 'save'` to the union type.

**`useSwipeMutation` current type restriction:**
```typescript
// Current:
mutationFn: ({ targetId, action }: { targetId: number; action: 'like' | 'pass' }) => postSwipe(targetId, action)
```
Fix: expand to include `'super_like' | 'save'`.

**Frontend ActionButtons:** Currently has Pass / Message (disabled) / Like. Phase 3 requirement (MATCH-07) adds "Сохранить" and "Супер мэтч". These are relevant in the CandidateProfileSheet context. The main deck ActionButtons can stay as-is (pass/like from deck = standard flow). The sheet's ActionButtons should have the extended set. The existing `ActionButtons` component accepts `onMessage?` but the Message button is vestigial. For the sheet, planner can either: (a) add `onSave?` and `onSuperLike?` props to existing ActionButtons, or (b) create a dedicated `CandidateActionButtons` in the sheet. Given FSD rules, (a) is cleaner.

### 9. Roomie Score

**[VERIFIED: schema + requirement read]**

- `User.roomieScore Int @default(0)` — already in schema
- Currently always 0 (nothing computes it)
- `GET /onboarding/status` does NOT return it
- No `GET /profile/me` endpoint exists

**Computation approach:** Compute live in `ProfileService.getMe()`, return in response. Also recompute and save to DB when profile is updated in `PATCH /profile` (so it's always fresh).

**Score formula (PROF-04, confirmed from requirements):**
- +10 for at least 1 photo
- +10 for quizCompleted
- +10 for dealbreakers set (onboardingStep >= 4 is a proxy, or check that guestsPref / smokingOk / petsOk are non-default — but they have defaults so can't reliably detect "intentionally set". Use `onboardingStep >= 4`)
- +10 for isPhoneVerified (Phase 6 only, will be 0 for all Phase 3 users)

**Maximum achievable in Phase 3:** 30/40 (phone not verifiable yet).

**Tip display in RoomieScoreCard:** Always show all 4 tips; mark phone tip as inactive/grey in Phase 3.

### 10. Save for Later / Super Like

**[VERIFIED: schema read, DTO read]**

- Schema: `SwipeAction` has `save` and `super_like` — both exist.
- `SwipeService`: processes `super_like` same as `like` for match detection. `save` creates a swipe record only (no match).
- `SwipeActionDto`: missing `save` — this is a bug to fix.
- Frontend: no "save" or "super_like" buttons exist yet. To be added in CandidateProfileSheet (D-03 says Like + Pass in the sheet, but MATCH-07 requires 4 actions). Planner needs to decide whether Save/SuperLike appear in the sheet or deck buttons. UI-SPEC ActionButtons has pass/message/like — the message button is a good candidate to repurpose or accompany with save/superlike.

---

## Common Pitfalls

### Pitfall 1: queryKey mismatch after filter apply

**What goes wrong:** FilterSheet calls `queryClient.invalidateQueries({ queryKey: ['feed'] })`, but the active query has key `['feed', { budgetMin: 15000 }]`. The invalidation doesn't match, feed doesn't refetch.

**Why it happens:** React Query uses structural equality on queryKey arrays. `['feed']` ≠ `['feed', params]`.

**How to avoid:** Use `queryClient.invalidateQueries({ queryKey: ['feed'], exact: false })` OR change the design so the queryKey is always `['feed', params]` (with params defaulting to `{}`). The latter is cleaner.

**Warning signs:** Filter UI updates but feed doesn't change.

### Pitfall 2: Decimal type coercion in matchReasons

**What goes wrong:** Comparing `me.sleepSchedule < 0.2` when `me.sleepSchedule` is a Prisma `Decimal` object, not a JavaScript `number`. The comparison silently fails.

**Why it happens:** Prisma `Decimal` fields come back as `Prisma.Decimal` objects (wrapper), not native JS numbers.

**How to avoid:** Always call `Number(me.sleepSchedule)` before arithmetic. This pattern is already used in `computeLifestyleScore()` — follow it exactly.

**Warning signs:** All matchReasons arrays are empty; conditions never trigger.

### Pitfall 3: Card tap fires swipe

**What goes wrong:** `onPointerUp` on SwipeCard is used for swipe detection. Adding `onClick` alongside it causes both tap-to-open and swipe to fire.

**Why it happens:** Pointer events and click events both fire on release. The imperative drag system doesn't prevent click propagation.

**How to avoid:** Implement tap detection by tracking pointer delta in `onPointerUp`. If `Math.hypot(deltaX, deltaY) < 10`, it's a tap → call `onCardTap()`. Don't use `onClick`.

**Warning signs:** Profile sheet opens AND swipe animation plays simultaneously.

### Pitfall 4: FilterSheet z-index conflict with CandidateProfileSheet

**What goes wrong:** Both sheets are `fixed` positioned. FilterSheet is `z-40` (backdrop) / `z-50` (should be checked). CandidateProfileSheet should be higher.

**Why it happens:** The UI-SPEC defines: `CandidateProfileSheet z-50`, FilterSheet backdrop `z-30`, FilterSheet `z-40`. If both are open simultaneously, z-order matters.

**How to avoid:** Assign z-indices per UI-SPEC (confirmed): backdrop `z-30`, FilterSheet `z-40`, CandidateProfileSheet backdrop `z-40`, CandidateProfileSheet `z-50`. Never open both sheets simultaneously (they are mutually exclusive states in SwipeDeck).

**Warning signs:** CandidateProfileSheet appears behind FilterSheet.

### Pitfall 5: Missing `save` in SwipeActionDto breaks MATCH-07

**What goes wrong:** Calling `POST /swipes` with `action: 'save'` returns 400 Bad Request from the global ValidationPipe (class-validator rejects unknown enum value).

**Why it happens:** `SwipeActionDto` enum doesn't include `save`, but `SwipeAction` Prisma enum does.

**How to avoid:** Add `save = 'save'` to `SwipeActionDto` enum in `create-swipe.dto.ts`. This is a 1-line fix.

**Warning signs:** "action must be one of the following values: like, pass, super_like" error.

### Pitfall 6: DeckFilters type mismatch breaks activeCount in DeckToolbar

**What goes wrong:** DeckToolbar's `activeCount()` and `ActiveChips` iterate over `Object.keys(filters)`. Adding new fields (`districtIds`, `smokingOk`, etc.) with null/array defaults will break the equality check against `DEFAULT_FILTERS`.

**Why it happens:** `activeCount` checks `f[k] !== DEFAULT_FILTERS[k]`. Arrays (`districtIds: []`) are never reference-equal to `DEFAULT_FILTERS.districtIds = []` even when both are empty.

**How to avoid:** Update `activeCount` to handle array fields: `districtIds: JSON.stringify(f.districtIds) !== JSON.stringify(DEFAULT_FILTERS.districtIds)`. Or use a dedicated count function for the new fields.

**Warning signs:** Filter count badge shows non-zero even when all filters are at defaults.

### Pitfall 7: ProfileView needs its own data fetch (not from SwipeDeck)

**What goes wrong:** ProfileView renders in a different BottomNav tab from the SwipeDeck. It cannot access `profiles` from SwipeDeck state. If it tries, it will have stale or undefined data.

**Why it happens:** BottomNav tab switching unmounts/mounts different widgets; state is not shared between siblings.

**How to avoid:** ProfileView must have its own `useProfileQuery()` that calls `GET /profile/me`. Do not lift feed data to HomeView for ProfileView to consume.

**Warning signs:** ProfileView shows undefined data, or shows a different user's data.

---

## Code Examples

### GET /feed response (Phase 3 addition)

```typescript
// Source: feed.service.ts Step 7 (verified), with Phase 3 additions marked
return top20.map((c) => ({
  id: c.id,
  name: c.name,
  age: calculateAge(c.birthDate),
  scenario: c.scenario,
  budgetMin: c.budgetMin,
  budgetMax: c.budgetMax,
  smokingOk: c.smokingOk,      // NEW: needed for RulesSection
  petsOk: c.petsOk,            // NEW: needed for RulesSection
  guestsPref: c.guestsPref,    // NEW: needed for RulesSection
  photos: c.photos.map((p) => p.url),
  vibeTags: c.vibeTags.map((vt) => ({ id: vt.tag.id, label: vt.tag.label })),
  districts: c.districts.map((d) => ({ id: d.district.id, name: d.district.name })),
  lifestyleScales: {
    noiseLevel: c.noiseLevel ? Number(c.noiseLevel) : null,
    cleanliness: c.cleanliness ? Number(c.cleanliness) : null,
    sleepSchedule: c.sleepSchedule ? Number(c.sleepSchedule) : null,
    socialLevel: c.socialLevel ? Number(c.socialLevel) : null,
    workFromHome: c.workFromHome ? Number(c.workFromHome) : null,
  },
  matchScore: c._matchScore,
  matchReasons: generateMatchReasons(me, c), // NEW
  matchRisks: generateMatchRisks(me, c),     // NEW
}));
```

### RoomieProfile type extension (frontend)

```typescript
// Source: front/entities/profile/model/types.ts (verified), with Phase 3 additions
export interface RoomieProfile {
  id: number;
  name: string;
  age?: number;
  scenario: string;
  budgetMin: number | null;
  budgetMax: number | null;
  smokingOk: boolean;     // NEW
  petsOk: boolean;        // NEW
  guestsPref: 'rarely' | 'sometimes' | 'often'; // NEW
  photos: string[];
  vibeTags: { id: number; label: string }[];
  districts: { id: number; name: string }[];
  lifestyleScales: {
    noiseLevel: number | null;
    cleanliness: number | null;
    sleepSchedule: number | null;
    socialLevel: number | null;
    workFromHome: number | null;
  } | null;
  matchScore: number;
  matchReasons: string[];  // NEW
  matchRisks?: string[];   // NEW
}
```

### FeedQueryDto (new backend DTO)

```typescript
// Source: derived from onboarding DTO patterns [ASSUMED structure]
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GuestsPreference } from '@prisma/client';

export class FeedQueryDto {
  @IsOptional() @IsInt() @Type(() => Number)
  budgetMin?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  budgetMax?: number;

  @IsOptional() @IsArray() @IsInt({ each: true }) @Type(() => Number)
  // URL: ?districtIds[]=1&districtIds[]=2
  districtIds?: number[];

  @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true')
  smokingOk?: boolean;

  @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true')
  petsOk?: boolean;

  @IsOptional() @IsEnum(GuestsPreference)
  guestsPref?: GuestsPreference;
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Mock profiles from MOCK_PROFILES array | Real `GET /feed` via React Query | Phase 2 complete — this is already in production |
| `FilterSheet` → local React state only | Wire to `GET /feed` query params | Phase 3 task |
| No profile editing | New `PATCH /profile` endpoint | Phase 3 task |
| No profile page | ProfileView (replace stub) | Phase 3 task |

**Deprecated / outdated patterns in codebase:**
- `MOCK_PROFILES` in `entities/profile/model/` — still present but no longer used after Phase 2 wiring; safe to keep (or clean up as part of this phase's commit).
- The `GradientBackground` component is used in ProfileCard for the match badge. Per UI-SPEC, Phase 3 replaces it with a plain chip. The component may still be used elsewhere — don't delete, just stop using it in ProfileCard.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | matchReasons should be generated on-the-fly in `getFeed()`, not persisted to `Match.matchReasons` | Findings §4 | If team wants persistent matchReasons, architecture is different |
| A2 | MATCH-07 "4 swipe actions" means save/super_like should appear in CandidateProfileSheet buttons, not necessarily in the main deck ActionButtons | Findings §8 | If save/superlike needed in deck too, more frontend changes required |
| A3 | Roomie Score formula: +10 per criterion (photo, quiz, dealbreakers, phone) summing to 40 | Findings §9 | If formula is different, RoomieScoreCard display will be wrong |
| A4 | `onboardingStep >= 4` is a reliable proxy for "dealbreakers have been set" | Findings §9 | If users can have step >= 4 without setting dealbreakers, score is over-counted |
| A5 | VibeScaleBar and RulesSection should live in `shared/ui/` to allow reuse across both CandidateProfileSheet and ProfileView | Architecture §5 | If they stay in `widgets/candidate-profile/`, ProfileView cannot import them without violating FSD rules |
| A6 | `GET /profile/me` is a new endpoint (not reuse of `GET /onboarding/status`) | Findings §3 | Planner could decide to reuse onboarding/status with profile data added |

---

## Open Questions (RESOLVED)

1. **4 swipe action buttons layout in CandidateProfileSheet**
   - What we know: D-03 says "Like + Pass action buttons" in the sheet. MATCH-07 says 4 actions: like, save, super_like, pass.
   - What's unclear: Does the sheet show all 4 buttons or just 2? The UI-SPEC ActionButtons shows pass / message / like. Message button is currently disabled/vestigial.
   - Recommendation: Replace the message button slot with "Сохранить" (save) for Phase 3. Add super_like as a 4th button or repurpose the message button. Planner decides exact layout.
   - RESOLVED: Plan 03-05 defines 4 action buttons (like/pass/save/super_like) at the bottom of the sheet.

2. **Filter wiring — DeckFilters enum values vs API params**
   - What we know: FilterSheet has `budget: 'low' | 'mid' | 'high' | 'any'` which maps to budget ranges (e.g., low = 0–20000). The API needs `budgetMin` and `budgetMax` integers.
   - What's unclear: Exact threshold values for low/mid/high budget chips.
   - Recommendation: low = 0–20000, mid = 20000–35000, high = 35000+. Planner defines `filtersToQueryParams()` conversion function.
   - RESOLVED: Plan 03-04 maps DeckFilters.budget chip values ('low'='до 30к', 'mid'='30-60к', 'high'='60к+') to numeric budgetMin/budgetMax in apiFetch call.

3. **Profile fetch in ProfileView — auth context**
   - What we know: `GET /profile/me` requires JWT bearer token. `shared/lib/api/client.ts` handles auth injection.
   - What's unclear: Is the JWT token always available when ProfileView mounts (user is in MainShell, past onboarding)?
   - Recommendation: Yes — if user reaches MainShell, they've completed auth. The JWT is in token storage. Safe to fetch.
   - RESOLVED: Plan 03-04 useSwipeMutation updated to invalidate ['feed'] on both like and save actions.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | All backend data | ✓ (docker-compose.yml present) | Postgres 16-alpine | — |
| Node.js | Frontend + backend | ✓ (assumed from Phase 2 working) | — | — |
| @tanstack/react-query | Feed query | ✓ (in package.json) | installed | — |
| @prisma/client | DB access | ✓ (generated) | v7 | — |

Step 2.6: No new external dependencies. All tools available.

---

## Validation Architecture

> `workflow.nyquist_validation` key not found in `.planning/config.json` (no config.json exists) — treating as enabled per instructions.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (NestJS default, confirmed from `onboarding.service.spec.ts`) |
| Config file | none found explicitly — Jest config in package.json |
| Quick run command | `cd "roomies back" && npm test -- --testPathPattern=feed` |
| Full suite command | `cd "roomies back" && npm test` |

Frontend has no test files detected. Phase 3 backend tests should cover:
- `FeedService.getFeed()` with filter params
- `ProfileService.getMe()` returning correct shape
- `ProfileService.updateProfile()` updating correct fields
- `matchReasons` generation logic

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MATCH-06 | `GET /feed` returns `matchReasons: string[]` | unit | `npm test -- --testPathPattern=feed.service` | ❌ Wave 0 |
| MATCH-07 | `POST /swipes` accepts `action: 'save'` | unit | `npm test -- --testPathPattern=swipe.service` | ❌ Wave 0 |
| MATCH-08 | Match overlay shows reasons from profile data | manual | inspect DOM | — |
| MATCH-09 | `GET /feed?budgetMin=15000` returns filtered results | unit | `npm test -- --testPathPattern=feed.service` | ❌ Wave 0 |
| PROF-01 | `PATCH /profile` updates name, photos, tags | unit | `npm test -- --testPathPattern=profile.service` | ❌ Wave 0 |
| PROF-04 | `GET /profile/me` computes correct roomieScore | unit | `npm test -- --testPathPattern=profile.service` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `roomies back/src/feed/feed.service.spec.ts` — covers MATCH-06, MATCH-09 (filter params)
- [ ] `roomies back/src/swipe/swipe.service.spec.ts` — covers MATCH-07 (`save` action)
- [ ] `roomies back/src/profile/profile.service.spec.ts` — covers PROF-01, PROF-04

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JwtAuthGuard on all new endpoints (GET /profile/me, PATCH /profile, GET /feed with params) |
| V3 Session Management | no | JWT is stateless; no server session |
| V4 Access Control | yes | `@CurrentUser()` ensures users can only read/edit their own profile |
| V5 Input Validation | yes | `class-validator` on FeedQueryDto, UpdateProfileDto |
| V6 Cryptography | no | No new crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| User reads another user's profile | EoP | `@CurrentUser()` param — service always uses `user.id`, never takes userId from body/query |
| User edits another user's profile | Tampering | Same: `PATCH /profile` uses JWT identity only, no `userId` in body |
| Feed poisoning via invalid filter params | Tampering | `class-validator` on FeedQueryDto rejects invalid types |
| BigInt overflow on telegramId | Tampering | BigInt throughout — never cast to number |

---

## Sources

### Primary (HIGH confidence — verified by direct file read in this session)

- `roomies back/src/feed/feed.service.ts` — getFeed implementation, current response shape, score computation
- `roomies back/prisma/schema.prisma` — all model fields, SwipeAction enum, Match model
- `roomies back/src/swipe/dto/create-swipe.dto.ts` — SwipeActionDto (missing `save`)
- `roomies back/src/swipe/swipe.service.ts` — mutual match detection logic
- `roomies back/src/onboarding/onboarding.service.ts` — profile save pattern, computeScales
- `roomies back/src/onboarding/onboarding.controller.ts` — endpoint patterns
- `front/features/swipe-profile/model/use-feed-query.ts` — React Query setup
- `front/features/swipe-profile/model/use-swipe-deck.ts` — deck state management
- `front/features/swipe-profile/ui/ActionButtons.tsx` — current button layout
- `front/entities/profile/model/types.ts` — RoomieProfile type
- `front/entities/profile/ui/ProfileCard.tsx` — current card rendering
- `front/widgets/swipe-deck/ui/SwipeDeck.tsx` — full deck widget
- `front/widgets/swipe-deck/ui/FilterSheet.tsx` — filter UI and DeckFilters type
- `front/widgets/swipe-deck/ui/DeckToolbar.tsx` — toolbar with activeCount
- `front/widgets/profile/ui/ProfileView.tsx` — stub confirmed
- `front/widgets/chat/ui/ChatView.tsx` — stub confirmed (do not touch)
- `front/shared/lib/api/feed.ts` — API shape, postSwipe signature
- `front/shared/lib/query/client.ts` — QueryClient config
- `.planning/UNCOMMITTED-WORK.md` — full inventory of uncommitted work
- `.planning/phases/3/03-CONTEXT.md` — locked decisions
- `.planning/phases/3/03-UI-SPEC.md` — approved visual spec
- `.planning/codebase/ARCHITECTURE.md` — FSD rules

### Secondary (MEDIUM confidence)

- `roomies back/src/app.module.ts` — confirms no ProfileModule exists yet
- `front/shared/lib/api/index.ts` — API barrel exports

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from package.json and codebase
- Architecture: HIGH — verified from direct file reads
- Backend gaps: HIGH — verified by reading feed.service.ts and onboarding patterns
- Frontend gaps: HIGH — verified by reading actual component files
- matchReasons generation: MEDIUM — approach derived from codebase patterns, exact templates are ASSUMED
- Pitfalls: HIGH — based on directly observed code patterns

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (schema is stable; pitfalls are code-pattern-specific)
