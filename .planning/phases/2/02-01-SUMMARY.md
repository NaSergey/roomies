---
phase: 02-matching-engine
plan: "02-01"
subsystem: backend/seed
tags: [seed, prisma, fake-data, matching-engine]
dependency_graph:
  requires: [Phase 1 seed (cities, districts, vibe tags, quiz questions)]
  provides: [25 fake completed user profiles in DB with lifestyle scales, quiz answers, districts, vibe tags]
  affects: [02-02 feed endpoint — needs populated DB to return results]
tech_stack:
  added: []
  patterns: [prisma.$transaction per user, upsert by telegramId for idempotency]
key_files:
  created: []
  modified:
    - roomies back/prisma/seed.ts
decisions:
  - "Deterministic FAKE_USERS array (not Math.random()) prevents re-seed churn and makes diffs reviewable"
  - "District count guard (>=5 Moscow districts) catches misconfigured DB before out-of-bounds array access"
  - "fakeCount check at end of main() surfaces partial-seed failures rather than silently leaving incomplete data"
  - "Scenario distribution: 13 looking_housing_roomie + 10 has_housing_seeking_roomie ensures feed query returns results for both scenario types"
metrics:
  duration: 20m
  completed_date: "2026-06-10"
  tasks_completed: 1
  files_modified: 1
---

# Phase 2 Plan 1: Seed Fake Profiles Summary

**One-liner:** Added `seedFakeProfiles()` to `prisma/seed.ts` — 25 deterministic fake users with BigInt telegramIds, full lifestyle scales, 10 quiz answers, 2 districts, and 3 vibe tags each, seeded idempotently via `upsert` by `telegramId`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add seedFakeProfiles() to prisma/seed.ts | d9bc6ac | roomies back/prisma/seed.ts |

## What Was Built

The existing `prisma/seed.ts` was extended with:

1. A `FakeUser` interface and `FAKE_USERS` constant array of 25 entries with explicit deterministic values.
2. `seedFakeProfiles()` async function that:
   - Fetches Moscow city ID and districts at runtime (FK resolution)
   - Guards against fewer than 5 Moscow districts before any array indexing
   - Runs each fake user through `prisma.$transaction` with `user.upsert`, `userDistrict.deleteMany/createMany`, `userVibeTag.deleteMany/createMany`, and `userQuizAnswer.upsert` per answer
3. Call to `await seedFakeProfiles()` inserted in `main()` after step 4 (vibe tags).
4. Integrity check at end of `main()`: logs `Fake completed profiles: N` and throws if `N < 20`.

Scenario distribution across the 25 fakes:
- 13 × `looking_housing_roomie`
- 10 × `has_housing_seeking_roomie`
- 2 × `looking_roomie_find_housing`

Lifestyle scales are spread across the 0–1 range (not uniform), producing varied scoring for the matching algorithm.

## Verification Results

- `npx prisma db seed` (first run): exits 0, prints `Fake completed profiles: 26` (25 fakes + 1 real test user)
- `npx prisma db seed` (second run): exits 0, same counts — idempotency confirmed
- `npx tsc --noEmit`: exits 0, no TypeScript errors
- `prisma.user.count({ telegramId range 1100000001–1100000025 })`: returns 25
- `prisma.user.count({ onboardingCompleted: true, noiseLevel: not null })`: returns 26 (≥20)
- Sample user check: cityId=1, 2 districts, 3 vibe tags, 10 quiz answers per user — all correct

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All 25 users have real data wired (lifestyle scales, quiz answers, districts, vibe tags).

## Deferred Items

One pre-existing issue logged to `deferred-items.md` (not introduced by this plan):
- `cities` table lacks a unique constraint on `name`, causing duplicate city rows on every seed re-run. Fake users consistently use cityId=1 (first Moscow found). This could affect feed filtering in Plan 02-02 if real users end up with a different Moscow cityId. Flagged for Plan 02-02 awareness.

## Threat Flags

No new security-relevant surface introduced. Seed runs with admin DB credentials (pre-existing pattern). Fake telegramId range 1.1B is within valid Telegram ID space but non-conflicting with real user IDs per T-02-01-01.

## Self-Check: PASSED

- File exists: `roomies back/prisma/seed.ts` — FOUND
- Commit d9bc6ac exists — FOUND
- DB count (fake range): 25 — PASSED
- DB count (completed with scales): 26 (≥20) — PASSED
- TypeScript clean — PASSED
- Idempotency (2nd run same count) — PASSED
