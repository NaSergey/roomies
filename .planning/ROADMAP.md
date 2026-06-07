# Roomie App — Roadmap

## Overview

Roomie App is a Telegram Mini App that matches roommates (18–30 y.o.) by vibe and lifestyle. The backend (NestJS + Prisma + Postgres), full DB schema, Telegram auth (initData → JWT), and a swipe UI on mock data already exist. This roadmap turns that prototype into a working product by wiring real data through the existing schema, one end-to-end user capability per phase.

**Granularity:** Standard (7 phases)
**Mode:** Vertical MVP — every phase ships a user-observable capability backed by real data.
**Coverage:** 45/45 v1 requirements mapped, 0 orphans.

The critical path follows the user journey: onboard → get scored matches → browse a real feed → talk and agree → search as a squad → stay safe and engaged → pay for reach.

## Phases

- [ ] **Phase 1: Onboarding** — User completes the 7-step flow (incl. Vibe Quiz) and lands on first matches.
- [ ] **Phase 2: Matching Engine** — Real Match Score (Hard/Lifestyle/Vibe/Behavioral) replaces mock data.
- [ ] **Phase 3: Discovery & Profiles** — Real feed with compatibility %, filters, candidate profile, editable own profile.
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
**Plans:** TBD
**UI hint:** yes

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
**Plans:** TBD

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
**Plans:** TBD
**UI hint:** yes

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
**Plans:** TBD
**UI hint:** yes

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
| 1. Onboarding | 0/0 | Not started | - |
| 2. Matching Engine | 0/0 | Not started | - |
| 3. Discovery & Profiles | 0/0 | Not started | - |
| 4. Chat & Agreement | 0/0 | Not started | - |
| 5. Squad Mode | 0/0 | Not started | - |
| 6. Trust, Notifications & Feedback | 0/0 | Not started | - |
| 7. Monetization | 0/0 | Not started | - |

---
*Roadmap created: 2026-06-07*
