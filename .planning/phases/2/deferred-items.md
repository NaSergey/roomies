# Deferred Items — Phase 2

## Pre-existing Issues (Out of Scope for Current Task)

### City/District Deduplication (pre-existing seed bug)
- **Discovered during:** Plan 02-01, Task 1
- **Issue:** `prisma.city.createMany` uses `skipDuplicates: true` but the `cities` table has no unique constraint on `name`, causing duplicate city rows on every re-seed run.
- **Impact:** After 3 seed runs, Moscow appears 3 times with IDs 1, 2, 3. `seedFakeProfiles()` uses `findFirst({ where: { name: 'Москва' } })` which consistently returns cityId=1. Real users created via onboarding GET /geo/cities and use whichever city ID the frontend picks — likely ID 1 since that's what GeoController returns first.
- **Risk for Plan 02-02:** Feed endpoint filters `cityId = currentUser.cityId`. If a real test user has cityId=1 and fake users also have cityId=1, the feed works. If city IDs diverge (e.g., new user gets cityId=2 Moscow), feed returns empty. **Mitigate in Plan 02-02:** GeoController should deduplicate cities, or seed should add unique constraint to cities.name.
- **Status:** Deferred — does not block Plan 02-01. Should be fixed in Plan 02-02 or a follow-up migration.
