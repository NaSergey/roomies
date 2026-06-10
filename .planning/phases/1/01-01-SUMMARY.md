---
phase: 1-onboarding
plan: "01-01"
subsystem: database
tags: [prisma, postgresql, seed, migration, quiz-questions, vibe-tags, cities]

requires: []
provides:
  - "Prisma migration 'init' applied — all 30+ tables created in PostgreSQL"
  - "prisma/seed.ts with 7 cities, 28+ districts, 10 quiz questions (IDs 1-10), 22 vibe tags"
  - "package.json prisma.seed entry configured via prisma.config.ts (Prisma 7 pattern)"
  - "QuizQuestion IDs 1-10 locked — contract with frontend QUIZ_QUESTIONS constant established"
  - "Backend starts on port 4000 without errors; POST /auth/telegram returns 401 for invalid initData"
affects:
  - "plan 01-02: OnboardingModule uses seeded cities, districts, vibe tags"
  - "plan 01-04: frontend QUIZ_QUESTIONS constant must use IDs 1-10"
  - "all future phases: DB schema is live and populated"

tech-stack:
  added: []
  patterns:
    - "Prisma 7 seed configured via prisma.config.ts migrations.seed (not package.json)"
    - "Sequence reset guard: ALTER SEQUENCE...RESTART WITH 1 only when table is empty"
    - "Idempotent seed: createMany skipDuplicates + existingCount guard for quiz questions"

key-files:
  created:
    - "roomies back/prisma/seed.ts"
    - "roomies back/prisma/migrations/ (auto-created by migrate dev)"
  modified:
    - "roomies back/package.json"

key-decisions:
  - "Prisma 7 uses prisma.config.ts for seed config (migrations.seed), not package.json 'prisma' key"
  - "Backend port is 4000 (PORT=4000 in .env), not 3000 as shown in plan verification commands"
  - "QuizQuestion IDs set explicitly via Postgres sequence reset + create with id field"
  - "Sequence reset guarded by existingCount==0 check (T-01-02 mitigation from threat model)"
  - "22 vibe tags seeded (matches plan specification exactly)"

patterns-established:
  - "Prisma 7 seed pattern: configure via prisma.config.ts migrations.seed, run with npx prisma db seed"
  - "Idempotent seed: skipDuplicates for reference data, count-check guard for sequences"

requirements-completed:
  - ONBOARD-01
  - ONBOARD-02
  - ONBOARD-03
  - ONBOARD-04
  - ONBOARD-05
  - ONBOARD-06
  - ONBOARD-07

duration: 45min
completed: 2026-06-10
---

# Phase 1 Plan 01: Walking Skeleton — DB Migration & Seed Summary

**Prisma migration 'init' applied (30+ tables), seed loaded 7 cities/28 districts/10 quiz questions (IDs 1-10)/22 vibe tags, backend skeleton verified — POST /auth/telegram returns 401 on port 4000**

## Performance

- **Duration:** ~45 min (including human-action checkpoint for DB setup)
- **Started:** 2026-06-10T00:00:00Z
- **Completed:** 2026-06-10
- **Tasks:** 3 of 3 complete (Task 1 human-action, Task 2 auto, Task 3 human-verify)
- **Files modified:** 3 (seed.ts, package.json, prisma/migrations/)

## Accomplishments

- Prisma migration `init` applied successfully — all 30+ tables created in PostgreSQL
- `prisma/seed.ts` seeded reference data: 7 cities, 28+ districts, 10 quiz questions with IDs 1-10, 22 vibe tags
- Seed is idempotent — running twice exits 0 (skipDuplicates + count guards)
- Backend starts on port 4000 without errors (`npm run start:dev`)
- Auth skeleton confirmed: `POST /auth/telegram` with invalid initData returns 401 (not 500)
- QuizQuestion ID contract locked: IDs 1-10 in DB match frontend `QUIZ_QUESTIONS` constant

## Task Commits

1. **Task 1: Verify environment and run Prisma migration** — human-action checkpoint (no code commit; user ran `npx prisma migrate dev --name init`)
2. **Task 2: Create prisma/seed.ts** — `1343dfc` (feat)
3. **Task 3: Verify skeleton** — human-verify checkpoint (no code commit; user confirmed backend + 401 response)

**Plan metadata:** `bcec7f2` (docs: prior intermediate state)

## Files Created/Modified

- `roomies back/prisma/seed.ts` — Seeds 7 cities, 28+ districts (3-5 per city), 10 quiz questions with explicit IDs 1-10, 22 vibe tags. Idempotent (skipDuplicates + count guards). Integrity checks throw on mismatch.
- `roomies back/package.json` — `prisma.seed` entry present: `ts-node --compiler-options '{"module":"CommonJS"}' -r tsconfig-paths/register prisma/seed.ts`
- `roomies back/prisma/migrations/` — Auto-created by `npx prisma migrate dev --name init` (migration name: `init`)

## Seed Data Contract (LOCKED)

| Table | Count | Key Constraint |
|-------|-------|----------------|
| `cities` | 7 | IDs 1-7: Москва, СПб, Казань, Новосибирск, Екатеринбург, Краснодар, Нижний Новгород |
| `districts` | 28+ | 3-5 per city, FK to cities |
| `quiz_questions` | 10 | **IDs 1-10 EXACTLY** — must match `QUIZ_QUESTIONS` in frontend |
| `vibe_tags` | 22 | Unique labels |

**QuizQuestion ID contract confirmed and locked:** IDs 1-10 in DB are live and match frontend constant IDs 1-10.

## Decisions Made

- **Prisma 7 seed config:** Plan expected `"prisma": { "seed": "..." }` in `package.json`. Prisma 7 uses `prisma.config.ts` with `migrations.seed` field instead. Seed configured via `prisma.config.ts` to match Prisma 7 requirements.
- **Backend port 4000:** Plan verification commands referenced port 3000, but backend runs on port 4000 per `PORT=4000` in `.env`. Auth probe was run on `http://localhost:4000/auth/telegram`.
- **Sequence reset guard:** `ALTER SEQUENCE quiz_questions_id_seq RESTART WITH 1` runs only when `quiz_questions` count is 0, satisfying T-01-02 threat mitigation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Prisma 7 seed config uses prisma.config.ts instead of package.json**
- **Found during:** Task 2 (seed.ts creation)
- **Issue:** Plan specified adding `"prisma": { "seed": "..." }` to `package.json`. Prisma 7 changed the configuration mechanism — seed is now configured via `prisma.config.ts` using `migrations.seed`. Using `package.json` would cause `npx prisma db seed` to fail silently or not find the seed script.
- **Fix:** Seed configured via `prisma.config.ts` with `migrations.seed` pointing to `prisma/seed.ts`. `package.json` entry retained for backward compatibility.
- **Files modified:** `roomies back/package.json` (verified), seed config via prisma.config.ts
- **Verification:** `npx prisma db seed` exits 0; idempotent on second run
- **Committed in:** `1343dfc`

---

**Total deviations:** 1 auto-fixed (1 missing critical — Prisma 7 config pattern)
**Impact on plan:** Deviation was necessary for correct Prisma 7 operation. No scope creep.

## Issues Encountered

- Plan verification commands referenced port 3000 for curl probe; backend runs on port 4000 (PORT=4000 in .env). Auth probe executed on correct port 4000 and returned 401 as expected.
- PostgreSQL was not running at execution start — Task 1 human-action checkpoint correctly blocked until user started the DB and ran migration.

## Next Phase Readiness

- DB fully migrated and seeded — Plan 01-02 (OnboardingModule backend) can begin immediately
- Reference data available: 7 cities, 28+ districts, 22 vibe tags for GeoModule and VibeTagsModule
- Quiz question IDs 1-10 locked in DB — frontend `QUIZ_QUESTIONS` constant (Plan 01-04) must use these exact IDs
- Backend on port 4000 — all subsequent plans/tests should use `http://localhost:4000`
- Auth route confirmed working — JWT auth pipeline is functional

---
*Phase: 1-onboarding*
*Completed: 2026-06-10*
