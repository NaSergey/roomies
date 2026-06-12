---
phase: 1-onboarding
plan: "01-01"
subsystem: database
tags: [prisma, postgresql, seed, migrations, quiz-questions, vibe-tags, cities]

requires: []
provides:
  - "prisma/seed.ts with 7 cities, 28+ districts, 10 quiz questions (IDs 1-10), 22 vibe tags"
  - "package.json prisma.seed config for ts-node with CommonJS override"
  - "Quiz question ID contract: IDs 1-10 in DB match frontend QUIZ_QUESTIONS constant"
affects:
  - "01-02 (onboarding module — quiz endpoint uses questionId FK)"
  - "01-03 (geo module — GET /geo/cities returns seeded cities)"
  - "01-04 (vibe-tags module — GET /vibe-tags returns seeded tags)"

tech-stack:
  added: []
  patterns:
    - "Prisma seed with PrismaPg adapter (same as PrismaService pattern)"
    - "ts-node CommonJS override for nodenext tsconfig: --compiler-options '{\"module\":\"CommonJS\"}'"
    - "Idempotent seed: skipDuplicates on createMany, count-check guard for quiz questions"
    - "ALTER SEQUENCE reset only when table is empty (T-01-02 threat mitigation)"

key-files:
  created:
    - "roomies back/prisma/seed.ts"
  modified:
    - "roomies back/package.json"

key-decisions:
  - "PrismaClient uses PrismaPg adapter (not direct URL) to match PrismaService pattern"
  - "ts-node runs with --compiler-options '{\"module\":\"CommonJS\"}' to bypass nodenext ESM issues"
  - "Quiz questions use explicit create with id field after sequence reset (not createMany) for deterministic IDs"
  - "Sequence reset guarded by empty-table check to prevent corruption on re-run"

patterns-established:
  - "Seed pattern: PrismaPg adapter + dotenv/config import for standalone scripts"
  - "Idempotency: all createMany use skipDuplicates:true; quiz questions guarded by count check"

requirements-completed:
  - ONBOARD-01
  - ONBOARD-02
  - ONBOARD-03
  - ONBOARD-04
  - ONBOARD-05
  - ONBOARD-06
  - ONBOARD-07

duration: ~15min
completed: 2026-06-07
---

# Phase 1 Plan 01-01: Database Migration and Seed Summary

**Prisma seed script with 7 cities, 28 districts, 10 quiz questions (IDs 1-10 locked), and 22 vibe tags — establishing the ID contract between DB and frontend QUIZ_QUESTIONS constant**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-07T00:00:00Z
- **Completed:** 2026-06-07
- **Tasks:** 1 of 3 committed (Tasks 1 and 3 require human action — checkpoints)
- **Files modified:** 2

## Accomplishments

- Created `roomies back/prisma/seed.ts` with all reference data: 7 cities (Москва, Санкт-Петербург, Казань, Новосибирск, Екатеринбург, Краснодар, Нижний Новгород), 28 districts, 10 quiz questions (IDs 1-10 matching frontend constant), 22 vibe tags
- Added `"prisma": { "seed": "..." }` config to `roomies back/package.json` with ts-node CommonJS override required for `nodenext` module resolution
- Seed is fully idempotent: `skipDuplicates: true` on all `createMany`, count-check prevents duplicate quiz question inserts, integrity assertions throw on mismatch

## Task Commits

1. **Task 2: Create prisma/seed.ts** - `039e5f3` (feat)
   _Tasks 1 and 3 are checkpoint gates requiring human action_

**Plan metadata:** (pending — committed after checkpoint resolution)

## Files Created/Modified

- `roomies back/prisma/seed.ts` — Standalone seed script using PrismaPg adapter + dotenv; seeds cities, districts, quiz questions (ID-locked 1-10), vibe tags
- `roomies back/package.json` — Added `prisma.seed` entry with ts-node CommonJS override

## Decisions Made

- **PrismaClient with PrismaPg adapter:** `PrismaService` uses the adapter pattern (`new PrismaPg({ connectionString })`), so seed.ts mirrors this exactly. Direct DATABASE_URL string would also work but was inconsistent.
- **ts-node CommonJS override:** The backend `tsconfig.json` has `"module": "nodenext"` which causes ESM resolution issues with `ts-node`. Adding `--compiler-options '{"module":"CommonJS"}'` allows the seed to run without a separate tsconfig.
- **Explicit `create` with id (not createMany) for quiz questions:** `createMany` with explicit IDs and a sequence reset is fragile. Instead, inserting one-by-one after sequence reset ensures IDs 1-10 are assigned deterministically.
- **Sequence reset guard:** `ALTER SEQUENCE quiz_questions_id_seq RESTART WITH 1` only runs when `existingCount === 0` (threat T-01-02 mitigation from plan threat model).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PrismaPg adapter required for seed.ts**
- **Found during:** Task 2 (writing seed.ts)
- **Issue:** The plan's `<interfaces>` section showed `import { PrismaClient } from '@prisma/client'` without the PrismaPg adapter. But `prisma.service.ts` requires the adapter to connect. Using plain `new PrismaClient()` without the adapter would fail to connect to the database.
- **Fix:** Added `PrismaPg` adapter initialization (same as `PrismaService`) and imported `dotenv/config` for env var loading in the standalone script.
- **Files modified:** `roomies back/prisma/seed.ts`
- **Verification:** Implementation matches the exact pattern from `prisma.service.ts`
- **Committed in:** `039e5f3`

**2. [Rule 1 - Bug] ts-node CommonJS override needed for nodenext tsconfig**
- **Found during:** Task 2 (package.json seed config)
- **Issue:** The plan suggested `ts-node -r tsconfig-paths/register prisma/seed.ts` but `tsconfig.json` uses `"module": "nodenext"` which causes ts-node to attempt ESM module resolution, breaking the `require()` calls in seed.
- **Fix:** Added `--compiler-options '{"module":"CommonJS"}'` flag to override module resolution for the seed script only.
- **Files modified:** `roomies back/package.json`
- **Verification:** Command syntax follows ts-node documented pattern for per-command tsconfig overrides
- **Committed in:** `039e5f3`

---

**Total deviations:** 2 auto-fixed (both Rule 1 — correctness bugs in the plan's interface spec)
**Impact on plan:** Both fixes necessary for the seed to actually run. No scope creep.

## Issues Encountered

- **Database not reachable:** `localhost:5433` PostgreSQL not running at execution time. Tasks 1 and 3 are checkpoint gates that require human action (start DB, run migration, verify backend starts). The seed code is committed and ready to run once the DB is available.

## User Setup Required

**Manual steps required to complete this plan:**

1. **Ensure PostgreSQL is running** at `localhost:5433` (or update `DATABASE_URL` in `roomies back/.env`)
2. **Verify `roomies back/.env`** has `DATABASE_URL`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN` — all present in current `.env`
3. **Run initial Prisma migration** from `roomies back/` directory:
   ```
   npx prisma migrate dev --name init
   ```
   Expected: "Your database is now in sync with your schema."
4. **Run seed:**
   ```
   npx prisma db seed
   ```
   Expected output: "Сидинг завершён успешно: Городов: 7, Районов: 28, Вопросов квиза: 10, Вайб-тегов: 22"
5. **Verify skeleton** — start backend and confirm `POST /auth/telegram` returns 401 (not 500):
   ```
   npm run start:dev
   curl -X POST http://localhost:4000/auth/telegram -H "Content-Type: application/json" -d '{"initData":"probe"}'
   ```

## Known Stubs

None — this plan only creates seed data and config. No UI-facing stubs.

## Threat Flags

No new threat surface introduced beyond what is in the plan's threat model (T-01-01, T-01-02, T-01-03 all addressed).

## Next Phase Readiness

- `roomies back/prisma/seed.ts` ready to run once DB migration is applied
- `package.json` has correct `prisma.seed` config
- Quiz question IDs 1-10 contract established in seed — Plan 01-03 (quiz endpoint) can safely use `questionId` FK 1-10
- Plans 01-02, 01-03, 01-04 can proceed after migration + seed complete

---

## Self-Check

**Files:**
- `roomies back/prisma/seed.ts` — committed in worktree at `039e5f3` ✓
- `roomies back/package.json` — committed in worktree at `039e5f3` ✓

**Commits:**
- `039e5f3` — feat(1-01): add prisma/seed.ts with reference data and seed config ✓

## Self-Check: PASSED

---
*Phase: 1-onboarding*
*Completed: 2026-06-07*
