# Phase 3: Discovery & Profiles — Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers a complete discovery experience on top of the real matching pipeline from Phase 2. After this phase:
- Swipe cards show a single overall Match Score % per candidate
- Tapping a card opens a bottom sheet with the candidate's full profile (sections: Вайб дома, Правила, О себе, Почему вы совпали) + Like / Pass action buttons
- The existing FilterSheet UI is wired to `GET /feed` query params (budget, districts, dealbreakers, vibe scales)
- Users can edit their own profile: name, photos, vibe tags, dealbreakers, budget, districts (PROF-01)
- Roomie Score is displayed on the own profile with improvement tips (PROF-04)

**What is NOT in Phase 3:** real-time chat (Phase 4), Squad cards (Phase 5), push notifications (Phase 6), Boost backend / monetization (Phase 7).

</domain>

<decisions>
## Implementation Decisions

### Candidate Profile — Opening Flow
- **D-01 LOCKED:** Tapping anywhere on a swipe card opens the candidate's detail profile.
- **D-02 LOCKED:** Profile renders in a **bottom sheet** that slides up from below. The swipe deck remains visible behind the sheet. Closing the sheet (drag-down or back gesture) returns to the swipe deck.
- **D-03 LOCKED:** The bottom sheet contains **Like + Pass action buttons** at the bottom. Tapping either performs the swipe action (calls `POST /swipes`) and dismisses the sheet.

### Candidate Profile — Content
- **D-04 LOCKED:** Section **"Вайб дома"** shows the 5 Vibe Quiz lifestyle scales (noiseLevel, cleanliness, sleepSchedule, socialLevel, workFromHome) as visual indicators (e.g., progress bars or score chips). Values come from the candidate's profile fields.
- **D-05 LOCKED:** Section **"Правила, которые важны"** shows hard dealbreakers: smokingOk, petsOk, guestsPref.
- **D-06 LOCKED:** Section **"О себе"** shows: name, age (calculated from birthDate), budget range, move-in date, scenario, city + districts, and vibe tags.
- **D-07 LOCKED:** Section **"Почему вы совпали"** shows 2–3 reasons generated **by the backend** as ready-to-display text strings. `GET /feed` returns `matchReasons: string[]` for each candidate. Frontend renders them directly — no client-side template generation.
- **D-08 LOCKED:** If a soft risk exists, the backend includes it in `matchRisks: string[]` (1 item max in Phase 3 MVP).

### Swipe Card (Feed)
- **D-09 LOCKED:** Swipe cards show a **single overall Match Score %** (one badge/sticker). E.g. "★ 87%". Breakdown components (lifestyle, vibe) are shown only inside the candidate profile sheet.
- The ProfileCard "score stickers" column (already built in uncommitted work) should show this single value. Backend's `matchScore` field (0–1 float) → multiply by 100 and round.

### Filters → API
- **D-10 (Claude's discretion):** Wire the existing `FilterSheet` filters to `GET /feed` query params. Apply on "Применить" button tap (not real-time debounced) to avoid excessive API calls. Invalidate/refetch `['feed']` on filter apply. Filters to wire: budgetMin/Max, districtIds, smokingOk, petsOk, guestsPref, optionally lifestyle scale ranges.
- **D-11 (Claude's discretion):** The `DeckFilters` type from `SwipeDeck` state maps to query string params — planner decides the exact param names on `GET /feed`.

### Own Profile Editing (PROF-01)
- **D-12 (Claude's discretion):** `ProfileView` (existing stub in `widgets/profile/`) becomes the own profile screen. Planner decides whether to inline-edit or use a separate edit mode.
- **D-13:** Photo upload to S3/R2 (presigned URL) was deferred from Phase 1 and is **in scope for Phase 3** (PROF-01 includes photos). Planner picks the upload approach. If S3 integration is complex, URL-input fallback is acceptable for MVP.

### Roomie Score (PROF-04)
- **D-14 (Claude's discretion):** Show Roomie Score as a numeric value + progress bar on own profile. Include a tip list: +10 за фото, +10 за квиз, +10 за правила, +10 за телефон. Backend computes the score (already has `roomieScore` field on User); planner adds a `GET /profile/me` or extends an existing endpoint.

### Claude's Discretion
- Exact layout/order of sections in the candidate bottom sheet
- Animation style for the bottom sheet (slide-up, spring vs ease)
- Whether "Boost" button in DeckToolbar does anything in Phase 3 (suggest: leave as UI-only toggle, no backend — Phase 7)
- Whether `GET /feed` supports pagination in Phase 3 (suggest: not needed yet, 20 results is enough)
- Exact Roomie Score formula implementation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Data
- `roomies back/prisma/schema.prisma` — User (lifestyle scales, dealbreakers, roomieScore), Match (matchReasons, matchRisks, matchScore), UserPhoto, UserVibeTag models
- `roomies back/src/feed/feed.service.ts` — existing feed service (already has hard SQL filters + age calc); extend to add matchReasons generation and additional filter params

### Existing Frontend (don't duplicate)
- `.planning/UNCOMMITTED-WORK.md` — full inventory of uncommitted work. Must read to avoid re-implementing what's already done (FilterSheet, DeckToolbar, ProfileCard neobrutalism, React Query setup, bulk seed)
- `front/widgets/swipe-deck/ui/SwipeDeck.tsx` — where to hook tap-to-open-profile
- `front/widgets/swipe-deck/ui/FilterSheet.tsx` — existing filter UI (local state) that needs API wiring
- `front/widgets/swipe-deck/ui/DeckToolbar.tsx` — toolbar with filter count + boost button
- `front/entities/profile/ui/ProfileCard.tsx` — swipe card component to update with single % badge
- `front/features/swipe-profile/model/use-feed-query.ts` — existing `useFeedQuery` / `useSwipeMutation` hooks (React Query)
- `front/widgets/profile/` — existing ProfileView stub for own profile
- `front/widgets/chat/` — existing ChatView stub (do not touch in Phase 3)

### Existing Backend Patterns
- `roomies back/src/auth/jwt-auth.guard.ts` — guard pattern (all new endpoints must be guarded)
- `roomies back/src/onboarding/onboarding.service.ts` — service pattern (PATCH endpoints for profile editing follow this)
- `roomies back/src/feed/feed.service.ts` — feed service to extend

### Requirements
- `REQUIREMENTS.md` — MATCH-06, MATCH-07, MATCH-08, MATCH-09, PROF-01, PROF-02, PROF-03, PROF-04
- `CLAUDE.md` — telegramId BigInt rule, FSD layer rule, match invariant user1Id < user2Id

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FilterSheet.tsx` + `DeckToolbar.tsx` — already built with local state; just need to propagate `DeckFilters` to `useFeedQuery` as query params
- `useSwipeMutation` — already calls `POST /swipes`; the profile bottom sheet Like/Pass buttons should reuse this mutation
- `ProfileCard` — already renders neobrutalism style with score stickers; update to show single Match Score %
- `SwipeDeck.tsx` — already manages `Map` of card DOM nodes; add `onClick` handler on each card to open profile sheet
- React Query `QueryClient` already set up in `shared/lib/query/client.ts`; feed invalidation pattern established

### Established Patterns
- All feed/swipe API calls go through `features/swipe-profile/model/` hooks (React Query)
- FSD: new profile detail feature goes in `features/profile-detail/` or as a widget
- `haptic()` from `shared/lib/telegram` for action button feedback
- Tailwind v4 CSS-only design tokens (no tailwind.config.js); neobrutalism theme vars in globals.css

### Integration Points
- `SwipeDeck.tsx` → add `onCardTap` → open candidate profile sheet
- `GET /feed` → extend response with `matchReasons`, `matchRisks`, `matchScore` (already returns `matchScore`; add reasons)
- `GET /feed` → add filter query params: `budgetMin`, `budgetMax`, `districtIds[]`, `smokingOk`, `petsOk`, `guestsPref`
- New `PATCH /profile` endpoint (or reuse onboarding endpoints) for own profile editing
- New `GET /profile/me` for fetching own profile with Roomie Score

</code_context>

<specifics>
## Specific Ideas

- Match % badge on swipe card: "★ 87%" format, one sticker in ProfileCard score column
- Candidate bottom sheet: drag handle at top, photo + name/age header, scrollable sections below, sticky Like/Pass buttons at bottom
- "Почему вы совпали" section: backend returns 2–3 text strings like "Похожий режим сна", "Оба не курят", "Любите тишину дома" — frontend renders as a list of chips or bullet points
- Backend matchReasons generation: template-based from score breakdown (e.g., if |lifestyleScore.sleepSchedule_diff| < 0.2 → "Похожий режим сна"; if both smokingOk=false → "Оба не курят")

</specifics>

<deferred>
## Deferred Ideas

- **Boost backend** — UI toggle already exists in DeckToolbar; real Boost logic (boostedUntil, Purchase) is Phase 7 (MONET-01)
- **MATCH-04**: Cosine similarity via VibeEmbedding / pgvector — deferred from Phase 2, still deferred
- **MATCH-05**: Real-time behavioral signals — BehavioralEvent writes on swipe — deferred
- **Feed pagination** — 20 results per call is sufficient for Phase 3; cursor pagination deferred
- **Photo upload to S3** — If scope is too large, acceptable to MVP with URL input for Phase 3 and do real S3 presigned upload in Phase 6/later

</deferred>

---

*Phase: 03-discovery-profiles*
*Context gathered: 2026-06-22*
