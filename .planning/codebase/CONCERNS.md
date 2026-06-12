# Codebase Concerns

**Analysis Date:** 2026-05-22

This is a frank inventory of debt, gaps, and risk in the Roomies monorepo (`front/` Next.js 16 Mini App + `roomies back/` NestJS 11). The project is in an early scaffolding state: the data model is rich, the runtime surface is thin, and the two halves are not yet wired together. Where a claim is "by design for now," it is still listed — anyone joining the project must see the gap before they trip on it.

---

## 1. Integration & Wiring Gaps

### Frontend does not call the backend at all

- **Problem:** There is no HTTP client, no `lib/api/`, no `shared/api/`, and no `fetch` / `axios` call anywhere under `front/app`, `front/entities`, `front/features`, `front/shared`, `front/views`, `front/widgets`. A `grep -r "fetch\|axios\|/auth/telegram"` across the whole `front/` source tree (excluding `node_modules` and `.next`) returns zero results.
- **Impact:** The Mini App has never made a request to the NestJS backend. The JWT issued by `POST /auth/telegram` cannot reach the UI, and nothing on the swipe surface is real.
- **Fix approach:**
  - Create `front/shared/api/` (FSD: shared layer for low-level transport) — typed fetch wrapper with `NEXT_PUBLIC_API_URL` base, bearer-token injection, error normalisation.
  - Create `front/features/auth-telegram/` to call `POST /auth/telegram` with `window.Telegram.WebApp.initData`, store the token (sessionStorage is sufficient for a Mini App since the WebView session is short-lived; avoid localStorage for one less XSS vector).
  - Create `front/entities/profile/api/` for the eventual feed endpoint.

### No CORS on the backend

- **Problem:** `roomies back/src/main.ts` does not call `app.enableCors(...)`. A `grep` for `cors|enableCors|helmet` in `main.ts` and `app.module.ts` returns nothing.
- **File:** `roomies back/src/main.ts:11-34`.
- **Impact:** Once the frontend is wired, any cross-origin request from the Cloudflare tunnel (`*.trycloudflare.com`) or production frontend domain will be blocked by the browser preflight. The Telegram in-app WebView has the same origin policy as a regular browser here.
- **Fix approach:** Add `app.enableCors({ origin: [process.env.WEB_ORIGIN, /\.trycloudflare\.com$/], credentials: false })` in `main.ts` before `app.listen(...)`. Source the allowed origin list from config, not hardcode.

### Prisma migrations have never been run

- **Problem:** `roomies back/prisma/migrations/` does not exist. Only `schema.prisma` (24 KB, fully fleshed out) sits in `roomies back/prisma/`.
- **Files:** `roomies back/prisma/schema.prisma` (model definitions only).
- **Impact:** There is no database. Any call to `POST /auth/telegram` will throw on the first Prisma query against a missing `users` table. The entire schema — `users`, `swipes`, `matches`, `chats`, `messages`, `squads`, `verifications`, `boosts`, `purchases`, `push_tokens`, etc. — is unrealised.
- **Fix approach:**
  1. Decide on host (local Postgres in Docker is fine for dev — pick a version, 16+ for `vector` extension future-compatibility).
  2. Set `DATABASE_URL` in `roomies back/.env`.
  3. Run `npx prisma migrate dev --name init` to bootstrap.
  4. The schema comment at line 339 notes "always guarantee `user1Id < user2Id` before inserting Match" — this is a Prisma limitation (no CHECK constraint support); the referenced `migrations/add_constraints.sql` does not yet exist and must be added as a follow-up raw-SQL migration.
  5. The schema comment at line 303 also flags a future swap of `Float[]` for `Unsupported("vector(N)")` once `pgvector` is enabled — note this is a non-trivial migration when it lands.

### `.env` files are not configured

- **Problem:**
  - `roomies back/.env` exists but is 83 bytes — too small to contain `DATABASE_URL`, `JWT_SECRET`, and `TELEGRAM_BOT_TOKEN` together. (Contents not inspected; secrets policy.)
  - `front/.env*` does not exist at all.
- **Files:** `roomies back/.env` (present, suspiciously small); no `front/.env` / `front/.env.local`.
- **Impact:** `AuthService` constructor calls `config.getOrThrow<string>('TELEGRAM_BOT_TOKEN')` (`roomies back/src/auth/auth.service.ts:23`) and `JwtModule` calls `config.getOrThrow<string>('JWT_SECRET')` (`roomies back/src/auth/auth.module.ts:14`). On first boot without these, the Nest app crashes at module init.
- **Fix approach:**
  - Add a committed `.env.example` to each half (no secrets, just keys + comments).
  - Document required keys in `roomies back/README.md`: `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_TTL_SECONDS` (optional, defaults to 604800), `TELEGRAM_BOT_TOKEN`, `PORT`.
  - For frontend once wired: `NEXT_PUBLIC_API_URL`.

---

## 2. Backend Gaps

### Feature surface is auth-only

- **Files:** `roomies back/src/auth/auth.controller.ts` exposes only `POST /auth/telegram` and `GET /auth/me`. No other controllers exist in `roomies back/src/`.
- **Impact:** The schema models swipes, matches, chats, messages, call invites, agreements, squads, verifications, behavioural events, reports, blocks, boosts, purchases, push tokens, notification preferences — **none of these have an HTTP surface**. The matching/chat/squad feature space is data-model-only.
- **Fix approach:** Plan modules in this order based on user flow dependencies:
  1. `users` (profile read/update — fills the `onboardingStep` progression).
  2. `feed` (returns swipe candidates filtered by the User's `scenario`, `cityId`, `budgetMin/Max`, hard filters).
  3. `swipes` (records `Swipe`, on mutual-positive creates `Match` + `Chat`).
  4. `matches` (list, score breakdown).
  5. `chat` / `messages`.
  6. Later: `squads`, `verifications`, `agreements`, `boosts`, `purchases`, `push`.

### No rate limiting

- **Problem:** `@nestjs/throttler` is not in `roomies back/package.json` dependencies. There is no `ThrottlerModule` or `ThrottlerGuard` anywhere.
- **Impact:**
  - `POST /auth/telegram` can be hammered. Even though the HMAC check is cheap and stateless, a `findUnique` + (sometimes) `create` happens per call. Anyone with a valid `initData` (or replayed within 24h) can force database writes via `lastSeenAt` updates.
  - Once feed/swipe endpoints exist, lack of throttling becomes an abuse vector for scraping the candidate pool.
- **Fix approach:** Install `@nestjs/throttler`, wire `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }])` in `app.module.ts`, register `ThrottlerGuard` as a global guard. Override per-route on `POST /auth/telegram` (lower) and feed (higher).

### `scenario` is hard-coded on signup

- **File:** `roomies back/src/auth/auth.service.ts:92` — `scenario: 'looking_housing_roomie'` is hardcoded inside `upsertUser`.
- **Impact:** Every new user is silently shoehorned into one of four product scenarios. This is the central product-segmentation field (it drives the feed query, the matching algorithm, and arguably the entire UX). The comment on line 91 ("scenario обязателен в схеме — задаём дефолт, пользователь поменяет в онбординге") acknowledges this is a workaround.
- **Fix approach:**
  - Make `scenario` nullable in `schema.prisma` (`scenario ScenarioType?`) and regenerate.
  - Have the frontend onboarding flow `PATCH /users/me` once the user picks a scenario.
  - Update the feed endpoint to refuse serving candidates while `scenario IS NULL` (force completion of onboarding).
  - Drop the `scenario` field from the `create()` payload in `upsertUser`.

### No refresh tokens

- **File:** `roomies back/src/auth/auth.service.ts:24-26, 46-48`. Only `accessToken` is signed; default TTL is 7 days.
- **Impact:**
  - 7-day tokens are long enough that a stolen token has a meaningful blast radius.
  - There is no revocation primitive. If we needed to log a user out server-side (banned, account deleted, password reset) we cannot — the token remains valid until natural expiry.
- **Fix approach:** Add a `refreshToken` flow (short-lived access ~15min + long-lived refresh ~30 days, refresh stored in DB or rotated). Alternatively keep the model simple and rely on Telegram's `initData` re-fetch every session (Mini App can always get fresh `initData` without user friction) — in which case shorten access TTL to ~24h.

### No global exception filter / response shaping

- **Problem:** No `app.useGlobalFilters(...)` in `roomies back/src/main.ts`. No `HttpExceptionFilter` exists in the source tree.
- **Impact:**
  - `UnauthorizedException` messages defined in code leak verbatim to the client: `'initData is empty'`, `'hash mismatch'`, `'initData expired'`, `'user payload is missing'`, `'user.id is missing'` (all from `roomies back/src/auth/telegram-init-data.ts`), and `'Missing bearer token'`, `'Invalid or expired token'` (from `jwt-auth.guard.ts:27, 35`).
  - The shapes differ from any house-style envelope (`{ ok, data, error }` or similar) — the frontend will have to handle Nest's default `{ statusCode, message, error }`.
- **Fix approach:** Add `roomies back/src/common/filters/http-exception.filter.ts` that maps known `InvalidInitDataError` codes to generic public messages while preserving a `code` enum for the frontend. Register globally in `main.ts`.

### No logging strategy

- **Problem:** Only the default Nest `Logger` is in use. No `pino`, no `winston`, no structured JSON output. No request-id propagation, no correlation between auth/upsert and downstream behaviour.
- **Impact:** Production debugging will be guesswork; aggregation tools (Loki, Datadog) get unstructured strings.
- **Fix approach:** Add `nestjs-pino` early (cheap to install, hard to retrofit once handlers proliferate). Emit `userId`, `requestId`, route, latency on every request.

### Only Telegram auth — no fallback path

- **Files:** `roomies back/src/auth/` is the entire auth module; controller exposes only `POST /auth/telegram`.
- **Impact:** This is intentional for a Telegram Mini App, but the schema has `email`, `phone` fields and a `Verification` model with `phone | selfie | student_email` types — implying email/phone flows are expected later. Right now those columns are unreachable. No password reset, no OTP, no email magic link.
- **Status:** Accept for now (Mini App scope) but document so it's not "discovered" as missing later.

### No replay cache on the `hash` itself

- **File:** `roomies back/src/auth/telegram-init-data.ts:54-68`. Hash is verified, `auth_date` is enforced ≤ 24h, but the verified hash is never recorded — an attacker holding a valid `initData` string can reuse it any number of times within the 24h window.
- **Impact:** Low. The damage on a replayed `initData` is limited to forcing the upsert path — `findUnique` + `update lastSeenAt`. No state change beyond `lastSeenAt`. But it is a deviation from a strict "single-use" auth model.
- **Fix approach (if/when needed):** Cache `hash` strings in Redis with TTL = `maxAgeSeconds`. Reject on second use.

---

## 3. Frontend Gaps

### Page renders hardcoded mock data

- **Files:**
  - `front/app/page.tsx` → returns `<HomeView />`.
  - `front/views/home/ui/HomeView.tsx:3,23` imports `MOCK_PROFILES` and passes it directly to `<SwipeDeck>`.
  - `front/entities/profile/model/mock-profiles.ts` — 6 hardcoded `RoomieProfile` entries (Алина, Максим, Дарья, Игорь, Полина, Артём) with Unsplash URLs.
- **Impact:** Nothing in the swipe deck reflects reality. There is no loading state, no error state, no empty state distinct from "out of mock cards."
- **Fix approach:**
  - Move `MOCK_PROFILES` to `entities/profile/model/__mocks__/` so it's clearly test-only.
  - Build `entities/profile/api/get-feed.ts` (fetches `GET /feed`).
  - Build `features/load-feed/` or use React Suspense / `use` for the data layer.

### No auth provider, no protected routes, no JWT storage

- **Problem:** `useTelegramWebApp` (`front/shared/lib/telegram/use-telegram-web-app.ts`) reads `window.Telegram.WebApp` for theme + ready/expand, but never reads `WebApp.initData` and never sends it anywhere. There is no `AuthContext`, no token store, no `RequireAuth` boundary.
- **Impact:** The Mini App is fully unauthenticated. Even if a backend feed existed, the frontend could not present a bearer token.
- **Fix approach:**
  - Extract `useTelegramInitData()` from the existing hook (or add as sibling) that exposes `WebApp.initData`.
  - On first render in `app/layout.tsx` (or a top-level client provider), `POST /auth/telegram` with `initData`, store the resulting access token in memory + sessionStorage.
  - Wrap the swipe view in a "needs token" guard.

### Image source is Unsplash

- **File:** `front/next.config.ts:8-15` whitelists `images.unsplash.com` only. Mock photos at `front/entities/profile/model/mock-profiles.ts:14, 27, 40, 53, 66, 79`.
- **Impact:** Fine for prototyping; not fine in production:
  - No control over availability.
  - Unsplash terms forbid building a "Service that replicates Unsplash" or persistent caching at scale.
  - No way to gate adult/inappropriate content (we don't own moderation pipeline).
- **Fix approach:** Set up S3-compatible storage (Cloudflare R2 is cheap, no egress fees) and a backend upload endpoint feeding `UserPhoto.url`. Add the storage domain to `next.config.ts → images.remotePatterns`.

### No error boundary, no offline state, no skeleton loaders

- **Problem:** No `error.tsx` in `front/app/`, no `loading.tsx`, no `not-found.tsx`. No suspense fallback. The swipe deck's only fallback is `widgets/swipe-deck/ui/EmptyState.tsx` for "out of cards."
- **Impact:**
  - Any thrown error in a client component crashes the whole tree silently in production.
  - On a flaky mobile network — the typical Telegram Mini App context — there is no skeleton or retry UI.
- **Fix approach:** Add Next.js convention files: `app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx`. Wrap feed in suspense once it has real fetching. **Per `front/AGENTS.md`: read `node_modules/next/dist/docs/` for the Next.js 16 conventions before implementing — APIs have shifted.**

### Cloudflare tunnel URL is ephemeral

- **File:** `front/next.config.ts:7` — `allowedDevOrigins: ['*.trycloudflare.com']`.
- **File:** `front/package.json:10` — `"tunnel": "concurrently … cloudflared tunnel --url http://localhost:3000"`.
- **Impact:** Every `cloudflared tunnel --url` invocation gets a fresh subdomain. The `@BotFather` Menu Button URL must be updated by hand each restart. Painful for any team larger than one developer; trivially forgotten.
- **Fix approach (cheap):** Use `cloudflared tunnel` with a **named tunnel** (`cloudflared tunnel create roomies-dev`) + a stable subdomain on a domain you control. Documented in Cloudflare's tunnel docs; one-time setup, stable forever. Persist the named tunnel config in repo.
- **Fix approach (cheaper, less reliable):** Use `localtunnel --subdomain roomies-dev` — same instability risk but with custom subdomain.

---

## 4. Security

### Telegram initData HMAC is correctly validated

- **File:** `roomies back/src/auth/telegram-init-data.ts:40-56`. Sorts non-`hash` entries alphabetically, joins with `\n`, derives secret key as `HMAC-SHA256("WebAppData", botToken)`, compares hashes.
- **Status:** Correct per Telegram's spec. No issue here.
- **Caveat:** Comparison at line 54 uses `!==`, not `crypto.timingSafeEqual`. Hash mismatch should not be timing-sensitive in this attack model (no per-user secret being probed bit-by-bit), but `timingSafeEqual` is defensive depth — consider adopting.

### Secret management for prod will need a vault

- **Problem:** `roomies back/.env` is currently the only secret store, and it is git-ignored (per `roomies back/.gitignore`). No vault, no SOPS-encrypted secrets, no cloud secret manager.
- **Impact:** Acceptable for one-developer dev. In production this means `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `DATABASE_URL` would either live in a hosting provider's environment-variable UI (acceptable if Fly/Railway/Render) or need real secret management.
- **Fix approach:** When deployment target is chosen, document the secret pipeline. Until then, no action.

### Dev server binds to `0.0.0.0`

- **File:** `front/package.json:6` — `"dev": "next dev --hostname 0.0.0.0"`.
- **Impact:** The dev server is reachable from the entire local network, not just localhost. Anyone on the same Wi-Fi (coffee shop, coworking, home with smart-home devices) can hit the dev server and source-map-mine the bundle. Fine inside the cloudflared-tunnel use case it was set up for, but worth knowing.
- **Fix approach:** Acceptable as documented; consider switching to `127.0.0.1` and routing through cloudflared specifically (`cloudflared tunnel --url http://127.0.0.1:3000` still works) if you ever work on an untrusted network.

### No CSP, no CSRF

- **Problem:** `front/app/layout.tsx` sets `metadata` and `viewport` but no `Content-Security-Policy`. No `helmet` on backend (not in `package.json`).
- **CSRF:** Telegram Mini App auth is bearer-token-based after login; CSRF is not strictly relevant once the API never reads cookies. Document this so a future reviewer doesn't add cookie-based auth and forget CSRF.
- **CSP:** Add via `next.config.ts → headers()` once the asset/API origins stabilise (must allow `https://telegram.org/js/telegram-web-app.js`, the API origin, the image CDN). Currently absent.

### `is_premium` field accepted without use

- **File:** `roomies back/src/auth/telegram-init-data.ts:10` declares `is_premium?` in the `TelegramUser` type but `upsertUser` (`auth.service.ts:84-96`) does not read it. Harmless; flag as TODO if you plan to drive features off Premium status.

---

## 5. Operational

### No deployment target, no Docker, no CI, no IaC

- **Problem:** There is no `Dockerfile` in either half, no `docker-compose.yml`, no `.github/workflows/`, no Terraform/Pulumi.
- **Impact:** Going from "works on my machine" to "running for real users" is undefined.
- **Fix approach (incremental):**
  1. **First:** `Dockerfile` per half + `docker-compose.yml` at repo root that includes Postgres. Removes the "set up Postgres locally" friction for new contributors.
  2. **Then:** A single GitHub Actions workflow that runs `npm ci && npm run lint && npm run build` for both halves on PR. Free, catches the obvious regressions.
  3. **Then:** Pick a host. For NestJS + Postgres: Fly.io or Railway have the gentlest learning curve. Cloudflare Pages for the Next.js frontend (free tier large enough for early days; supports `app` router on the Edge runtime, but be careful — see "Next.js 16 drift" below).
  4. **Later:** Terraform only when there's more than one environment.

### No observability

- **Problem:** No Sentry SDK in either `package.json`. No `prom-client`. No `/health` or `/readyz` endpoint (`app.controller.ts` exists but only as Nest scaffold).
- **Files:** `roomies back/src/app.controller.ts` (default scaffold).
- **Impact:** When (not if) prod breaks, the only signal is "user complains in Telegram chat."
- **Fix approach:**
  - Add `GET /health` that pings Prisma (`SELECT 1`) and returns 200 / 503.
  - Wire `@sentry/node` on backend, `@sentry/nextjs` on frontend, both behind `SENTRY_DSN` env. Cheap, high signal.
  - Defer Prometheus / OTel until traffic warrants it.

### Global `BigInt.prototype.toJSON` mutation

- **File:** `roomies back/src/main.ts:6-9`.
- **Impact:** Mutates a primitive prototype across the entire Node process. This is the standard workaround for `JSON.stringify(BigInt)` throwing, and is necessary because `User.telegramId` is `BigInt` in the schema (line 127 of `schema.prisma`). However:
  - It is invisible action-at-a-distance — any library in the process that JSON-serialises a `BigInt` will silently get a string back.
  - Any future test using `JSON.parse(JSON.stringify(user))` will see `telegramId` as a string, not a `bigint`, surprising the dev.
- **Mitigation:** Keep but document explicitly. Better: in DTOs, always project `telegramId` to string at the boundary (the `AuthTokensDto.telegramId` field is already typed as `string`, and `auth.controller.ts:27` already calls `.toString()` — good pattern). Then the global mutation becomes a belt-and-braces fallback for accidental serialisation paths and is safer to remove later.

---

## 6. FSD Discipline

### Layering is currently clean

- **Status verified:** Imports flow downward through layers in the canonical order: `app` → `views` → `widgets` → `features` → `entities` → `shared`. No upward or sideways imports detected in:
  - `front/app/page.tsx` (imports `@/views/home`).
  - `front/views/home/ui/HomeView.tsx` (imports `@/entities/profile`, `@/shared/lib/telegram`, `@/widgets/swipe-deck`).
  - `front/widgets/swipe-deck/*`, `front/features/swipe-profile/*`, `front/entities/profile/*` all use public `index.ts` barrels.
- **Concern:** Discipline is easy when the codebase is 14 files. Once backend integration adds `entities/profile/api/`, `features/auth-telegram/`, `features/load-feed/`, etc., enforcement matters.
- **Fix approach (preventive):** Add a `Steiger` config or an ESLint rule (`eslint-plugin-feature-sliced`, or the manual variant `eslint-plugin-boundaries`) to enforce the layer DAG in CI. Cheaper to set up while the rules are obvious than to bolt on after a violation has festered.

---

## 7. Tooling Drift Risk

### Next.js 16 just landed — your training data is wrong

- **File:** `front/AGENTS.md` and `front/CLAUDE.md` explicitly say _"This is NOT the Next.js you know. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."_
- **Known drifts to look out for:**
  - `next/legacy/image` is deprecated — use `next/image` only.
  - `images.domains` (in `next.config`) is deprecated in favour of `images.remotePatterns` — already correctly done in `front/next.config.ts:9-15`. Don't regress.
  - `next lint` has been removed. `front/package.json:9` already migrated to plain `"lint": "eslint"`. Don't revert.
  - App Router conventions, server actions, and caching semantics have shifted between Next 14/15/16. Verify against the bundled docs before authoring any route handler, server component, or `cache: 'force-cache'` decision.
- **Fix approach:** Maintain `front/AGENTS.md` as the single source of truth for "what changed." Before adding any new framework feature, read `node_modules/next/dist/docs/<topic>.md`. Do not rely on training data.

### Tailwind 4 — CSS-first config

- **Problem:** `front/package.json:18, 25` shows Tailwind `^4` + `@tailwindcss/postcss ^4`. Tailwind 4 abandoned the JS `tailwind.config.{js,ts}` model in favour of `@theme inline { … }` declared inside CSS. There is no `tailwind.config.*` file in the repo — correctly absent for v4.
- **Risk:** Future contributors used to v3 may try to re-introduce `tailwind.config.js`, file a "why isn't my theme working" bug, or import `@apply` patterns that no longer behave the same.
- **Fix approach:** Pin the convention in a short note (one paragraph) in `front/README.md` or `front/AGENTS.md`: "Tailwind 4 — theme tokens live in `app/globals.css` under `@theme`. No JS config."

### Prisma 7 — new generator

- **File:** `roomies back/package.json:29-30, 34` — `@prisma/client ^7.8.0`, `prisma ^7.8.0`, `@prisma/adapter-pg ^7.8.0`.
- **Risk:** Prisma 7 uses a new client generator (`prisma-client` with `runtime = "nodejs"` etc.) and `prisma.config.ts` instead of a `prisma` block in `package.json`. The repo has `roomies back/prisma.config.ts` (374 bytes — present, not inspected for correctness). Code generation now writes to `roomies back/generated/` (visible in directory listing). If anyone deletes that folder or expects `node_modules/@prisma/client`, the build will surprise them.
- **Fix approach:** Document the generated-client location and `npx prisma generate` requirement in `roomies back/README.md`.

---

## 8. Test Coverage Gaps

- **Backend:** Only `app.controller.spec.ts` (default Nest scaffold) exists. No tests for `AuthService`, `verifyTelegramInitData`, or `JwtAuthGuard`. **`verifyTelegramInitData` in particular is a security boundary that must have unit tests** — bad hash, expired auth_date, missing user, missing hash, malformed user JSON, all paths.
- **Frontend:** Zero test files. No `vitest.config`, no `jest.config`, no `*.test.tsx`. The swipe-deck logic (`features/swipe-profile/model/use-swipe-deck.ts`) is the kind of pure-ish hook that benefits most from a tiny test.
- **Priority:** Backend HMAC unit test = **High**. Frontend tests = **Medium**, but at least set up the harness before more logic lands.
- **Fix approach:**
  - `roomies back/src/auth/telegram-init-data.spec.ts` — synthesise an `initData` with a known bot token + known user payload, assert success; mutate each field, assert specific `InvalidInitDataError` messages.
  - For the frontend, add Vitest + `@testing-library/react` (Vitest works smoothly with the Next.js Vite dev pipeline as of 16).

---

## 9. Summary — Top 5 Things to Fix Before Anything Else

1. **Wire the frontend to the backend.** Create `front/shared/api/`, call `POST /auth/telegram` from `useTelegramWebApp`, store the JWT. Until this is done, the Mini App and the API are two separate projects.
2. **Run an initial Prisma migration and seed the DB.** Nothing else can be tested end-to-end until `users` and friends exist as tables.
3. **Enable CORS on the backend** (`enableCors` in `main.ts`). The frontend will hit a wall on the first request otherwise.
4. **Fix the hardcoded `scenario` on signup** by making it nullable in the schema and moving the choice to onboarding. This is the most visible product compromise in the code.
5. **Write the HMAC unit tests for `verifyTelegramInitData`.** It is currently the only meaningful security boundary in the codebase and has zero coverage.

Everything else in this document is real but secondary to those five.

---

*Concerns audit: 2026-05-22*
