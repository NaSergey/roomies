# Roomie App — Roadmap

## Overview

Roomie App is a Telegram Mini App that matches roommates (18–30 y.o.) by vibe and lifestyle. The backend (NestJS + Prisma + Postgres), full DB schema, Telegram auth (initData → JWT), and a swipe UI on mock data already exist. This roadmap turns that prototype into a working product by wiring real data through the existing schema, one end-to-end user capability per phase.

**Granularity:** Standard (7 phases)
**Mode:** Vertical MVP — every phase ships a user-observable capability backed by real data.
**Coverage:** 45/45 v1 requirements mapped, 0 orphans.

The critical path follows the user journey: onboard → get scored matches → browse a real feed → talk and agree → search as a squad → stay safe and engaged → pay for reach.

## Phases

- [x] **Phase 1: Onboarding** — User completes the 7-step flow (incl. Vibe Quiz) and lands on first matches. (COMPLETE: all 4 plans executed)
- [ ] **Phase 2: Matching Engine** — Real Match Score (Hard/Lifestyle/Vibe/Behavioral) replaces mock data.
- [x] **Phase 3: Discovery & Profiles** — Real feed with compatibility %, filters, candidate profile, editable own profile. (COMPLETE 2026-06-22)
- [ ] **Phase 4: Chat & Agreement** — Matched users chat, schedule calls, and negotiate a Roomie Agreement.
- [ ] **Phase 5: Squad Mode** — Users create/join squads and search together as a group.
- [ ] **Phase 6: Trust, Notifications & Feedback** — Verification, reports/blocks, push notifications, post-match feedback.
- [ ] **Phase 7: Monetization** — Boost profile and unlock "who liked me".

## Phase Details

### Phase 1: Onboarding
**Goal:** A new user authenticates via Telegram and completes the 7-step onboarding (scenario → location → budget → dealbreakers → Vibe Quiz → profile), with answers persisted to the existing `User`, `UserQuizAnswer`, `UserDistrict`, `UserPhoto`, and `UserVibeTag` tables, then lands on a first-matches screen.
**Mode:** mvp
**Depends on:** Nothing (first phase; builds on existing auth + schema)
**Requirements:** ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04, ONBOARD-05, ONBOARD-06, ONBOARD-07
**Success Criteria:**
  1. New user can pick one of the 4 scenarios and the choice is saved on their `User` record.
  2. User can set city (required) and districts, budget range, move-in date, stay duration, and dealbreakers (smoking, pets, guests), persisted to the DB.
  3. User can complete the 8–10 swipe-based Vibe Quiz with no text input, and normalized lifestyle scales (noise, cleanliness, sleep, social, WFH) are written to their profile.
  4. User can add name, 2–3 photos, and 3 vibe tags.
  5. On finishing onboarding the user reaches a first-matches screen (`onboardingCompleted` / `quizCompleted` set true).
**Plans:** 4 plans
**UI hint:** yes

Plans:
- [x] 01-01-PLAN.md — DB migration (init) + seed (cities, districts, 10 quiz questions IDs 1–10, 22 vibe tags) + Walking Skeleton proof (COMPLETE: migration applied, seed verified, POST /auth/telegram → 401 on port 4000)
- [x] 01-02-PLAN.md — Backend: OnboardingModule (8 endpoints), GeoModule (2 endpoints), VibeTagsModule (1 endpoint), AppModule registration (COMPLETE: npm run build green, 11 unit tests passing)
- [x] 01-03-PLAN.md — Frontend: steps 0–3 (ScenarioStep, LocationStep, BudgetStep, DealbreakersStep), useOnboarding hook, HomeView gate (COMPLETE: all 4 steps built, useOnboarding hook with submitScenario/Location/Budget/Dealbreakers, OnboardingFlow scaffold wired)
- [x] 01-04-PLAN.md — Frontend: steps 4–6 (QuizStep, ProfileStep, DoneStep), QUIZ_QUESTIONS constant, vibe-tags API (COMPLETE: 10-question A/B quiz, vibe tag picker, spring-animated Done screen, full 7-step flow navigable)

### Phase 2: Matching Engine
**Goal:** Replace mock profiles with a real matching pipeline that computes Match Score = Hard(35%) + Lifestyle(30%) + Vibe(25%) + Behavioral(10%), zeroes out hard-conflict candidates, and updates behavioral signals from user actions.
**Mode:** mvp
**Depends on:** Phase 1 (needs populated profiles + quiz answers to score against)
**Requirements:** MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05
**Success Criteria:**
  1. For any two compatible users the system produces a Match Score with a stored breakdown (`hardScore`, `lifestyleScore`, `vibeScore`, `behavioralScore`).
  2. When any hard factor (location, budget, smoking, pets) conflicts, the candidate scores 0 and is excluded from results.
  3. Lifestyle compatibility is derived from the 0–1 quiz scales with a penalty for large divergences, and Vibe compatibility uses cosine similarity over the quiz embedding vector plus vibe tags.
  4. User actions (like, message, reply, feedback) append `BehavioralEvent` rows that feed the behavioral component of future scores.
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Fake profiles seed: 25 completed users with varied scenarios, lifestyle scales, quiz answers, districts, vibe tags (Wave 0 — standalone) (COMPLETE: seedFakeProfiles() added, 25 fake users seeded, idempotent, d9bc6ac)
- [x] 02-02-PLAN.md — Backend: FeedModule (GET /feed with lifestyle scoring + hard filters) + SwipeModule (POST /swipes with mutual-like Match creation) (Wave 1) (COMPLETE: GET /feed + POST /swipes, build green, fd0e5b8 + 44c7af9)
- [x] 02-03-PLAN.md — Frontend wiring: getFeed()/postSwipe() API functions, RoomieProfile type update, SwipeDeck real data, match overlay (Wave 2) (COMPLETE: SwipeDeck on real feed, postSwipe on each action, match overlay, TypeScript clean, 7c8a6b8 + 0e422ac)

### Phase 3: Discovery & Profiles
**Goal:** The swipe feed serves real scored candidates from the DB with compatibility % and match reasons; users can swipe with all four actions, see a match screen on mutual like, open a detailed candidate profile, filter the feed, and edit their own profile (incl. Roomie Score).
**Mode:** mvp
**Depends on:** Phase 2 (feed requires real Match Scores)
**Requirements:** MATCH-06, MATCH-07, MATCH-08, MATCH-09, PROF-01, PROF-02, PROF-03, PROF-04
**Success Criteria:**
  1. User sees a feed of real candidate cards each showing compatibility % and 2–3 match reasons.
  2. User can swipe like / save / super like / pass, and a mutual like surfaces a match screen with the reasons they matched.
  3. User can open a candidate's detailed profile with "Вайб дома", "Правила", "О себе", and a "Почему вы совпали" block (2–3 reasons plus a soft risk if present).
  4. User can open filters and adjust budget, districts, dealbreakers, and vibe scales, and the feed updates accordingly.
  5. User can edit their own profile (photos, name, vibe tags, dealbreakers, budget, districts) and see their Roomie Score with how to improve it.
**Plans:** 6 plans
**UI hint:** yes

Plans:
- [x] 03-01-PLAN.md — Backend: extend GET /feed (matchReasons, matchRisks, smokingOk/petsOk/guestsPref fields + filter query params via FeedQueryDto) + fix SwipeActionDto add 'save' (Wave 1) (COMPLETE 2026-06-22)
- [x] 03-02-PLAN.md — Backend: new ProfileModule — GET /profile/me (own data + Roomie Score) + PATCH /profile (edit name, photos, tags, budget, districts, dealbreakers), register in AppModule (Wave 1) (COMPLETE 2026-06-22)
- [x] 03-03-PLAN.md — Frontend types + API layer + hooks: extend RoomieProfile/FeedCandidate, new profile.ts API, useFeedQuery(params), useSwipeMutation all 4 actions, useProfileQuery/usePatchProfile, shared UI VibeScaleBar/RulesSection/MatchReasonsList (Wave 2) (COMPLETE 2026-06-22)
- [x] 03-04-PLAN.md — Frontend SwipeDeck wiring: FilterSheet extended (onApply + district/dealbreaker rows), DeckToolbar activeCount fix, ProfileCard single ★ N% badge, SwipeDeck queryParams + onCardTap, ActionButtons onSave/onSuperLike (Wave 3) (COMPLETE 2026-06-22)
- [x] 03-05-PLAN.md — Frontend: CandidateProfileSheet widget with 4 sections (ВАЙБ ДОМА, ПРАВИЛА, О СЕБЕ, ПОЧЕМУ ВЫ СОВПАЛИ) + Like/Pass/Save/SuperLike action buttons (Wave 3) (COMPLETE 2026-06-22)
- [x] 03-06-PLAN.md — Frontend: ProfileView (replace stub), RoomieScoreCard, ProfileEditSheet with full form + PATCH /profile mutation (Wave 4) (COMPLETE 2026-06-22)

### Phase 4: Chat & Agreement
**Goal:** Matched users hold a full conversation — smart-chip starters, text messages, call scheduling with slot proposals, and a quiet-chat nudge — and can negotiate a Roomie Agreement covering house rules.
**Mode:** mvp
**Depends on:** Phase 3 (chat opens from a real match)
**Requirements:** CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, AGREE-01, AGREE-02, AGREE-03
**Success Criteria:**
  1. A chat opens automatically after a mutual match, and an empty chat shows smart-chip starter questions.
  2. Users can exchange text messages in real time.
  3. A user can propose call slots (CallInvite) and the recipient can accept a slot or propose another time.
  4. A soft nudge appears when a chat is silent for 12–24 hours.
  5. A user can start a Roomie Agreement with the standard items (quiet after 23:00, cleaning, guests, utilities, shared zones) and the other participant can accept or decline it.
**Plans:** 4 plans
**UI hint:** yes

Plans:
- [x] 04-01-PLAN.md — Backend: ChatModule (11 endpoints: GET /matches, GET+POST /chats/:id/messages, POST+PATCH /call-invites, POST+PATCH /agreements, PATCH /read, GET /call-invites, GET /agreements) + SwipeService auto-creates Chat on Match (Wave 1) (COMPLETE 2026-06-23)
- [ ] 04-02-PLAN.md — Frontend: API layer (chat.ts types + functions) + React Query hooks (useMatchesQuery, useChatMessagesQuery with 3s polling, useSendMessage, useCallInvite, useAgreement) (Wave 2)
- [ ] 04-03-PLAN.md — Frontend: MatchList + MessageBubble + SmartChips + ChatConversation (with nudge bar + Telegram BackButton) + ChatView local-state router (Wave 3)
- [ ] 04-04-PLAN.md — Frontend: CallInviteCard + ProposeCallSheet (datetime-local picker) + AgreementCard + AgreementSheet + wire into ChatConversation (Wave 4)

### Phase 5: Squad Mode
**Goal:** Users can search as a group of 2–4: create a squad with name/budget/districts, invite and join members, and have squad cards appear in the feed.
**Mode:** mvp
**Depends on:** Phase 3 (squad cards render in the discovery feed)
**Requirements:** SQUAD-01, SQUAD-02, SQUAD-03, SQUAD-04
**Success Criteria:**
  1. User can create a squad (2–4 members) with a name, budget, and districts.
  2. User can invite other users to a squad and a user can accept an invite to join an existing squad.
  3. A squad card with combined budget and districts appears in the discovery feed.
**Plans:** TBD
**UI hint:** yes

### Phase 6: Trust, Notifications & Feedback
**Goal:** Make the product safe and sticky — phone and selfie verification, reporting and blocking, push notifications (match / message / call reminder) with user-controlled preferences, and one-tap post-match feedback that feeds the algorithm.
**Mode:** mvp
**Depends on:** Phase 4 (notifications and feedback wrap the match + chat lifecycle)
**Requirements:** TRUST-01, TRUST-02, TRUST-03, TRUST-04, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, FEED-01, FEED-02
**Success Criteria:**
  1. User can verify their phone and verify themselves via selfie (artifact stored by reference only, not in DB).
  2. User can report another user (spam / fake / abuse / suspicious / other) and block another user.
  3. User receives push notifications for a new match, a new message, and a call reminder, and can configure which notifications they get.
  4. After talking, a user can give one-tap "вайб совпал?" feedback, and that feedback updates behavioral signals used by matching.
**Plans:** TBD
**UI hint:** yes

### Phase 7: Monetization
**Goal:** Let users pay for reach and visibility — buy a 12-hour profile Boost and unlock the list of people who liked them.
**Mode:** mvp
**Depends on:** Phase 3 (Boost affects feed ranking; "who liked me" needs real swipes)
**Requirements:** MONET-01, MONET-02
**Success Criteria:**
  1. User can purchase a Boost that raises their profile in the feed for 12 hours (`boostedUntil` / `Boost` + `Purchase` recorded).
  2. User can unlock and view the list of users who liked them.
**Plans:** TBD
**UI hint:** yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Onboarding | 4/4 | Complete | 2026-06-10 |
| 2. Matching Engine | 3/3 | Complete | 2026-06-10 |
| 3. Discovery & Profiles | 6/6 | Complete | 2026-06-22 |
| 4. Chat & Agreement | 0/4 | Planned | - |
| 5. Squad Mode | 0/0 | Not started | - |
| 6. Trust, Notifications & Feedback | 0/0 | Not started | - |
| 7. Monetization | 0/0 | Not started | - |

---
*Roadmap created: 2026-06-07*
*Updated: 2026-06-10 — Phase 2 planned: 3 plans (02-01 seed, 02-02 backend FeedModule+SwipeModule, 02-03 frontend wiring)*
*Updated: 2026-06-22 — Phase 3 planned: 6 plans (03-01 backend feed ext, 03-02 backend profile module, 03-03 frontend types+hooks+shared UI, 03-04 swipe deck wiring, 03-05 CandidateProfileSheet, 03-06 ProfileView+edit)*
*Updated: 2026-06-23 — Phase 4 planned: 4 plans (04-01 backend ChatModule, 04-02 frontend API+hooks, 04-03 MatchList+ChatConversation, 04-04 CallInviteCard+ProposeCallSheet+AgreementCard+AgreementSheet)*
