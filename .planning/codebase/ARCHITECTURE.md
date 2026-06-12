<!-- refreshed: 2026-05-22 -->
# Architecture

**Analysis Date:** 2026-05-22

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                       TELEGRAM MINI APP CLIENT                       │
│                       (Telegram WebView, mobile)                     │
│                                                                      │
│   `window.Telegram.WebApp` SDK — provides initData (HMAC-signed)     │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    FRONT  —  Next.js 16 App Router                   │
│                       (Feature-Sliced Design)                        │
├──────────────┬───────────────┬───────────────┬───────────┬───────────┤
│   app/       │   views/      │   widgets/    │ features/ │entities/  │
│ (routing)    │ (page         │ (composite    │(user      │(domain    │
│ `app/page`   │  composition) │  blocks)      │ actions)  │ models)   │
│              │ `home/`       │ `swipe-deck/` │`swipe-    │`profile/` │
│              │               │               │ profile/` │           │
├──────────────┴───────────────┴───────────────┴───────────┴───────────┤
│                              shared/                                 │
│              `shared/lib/telegram/`, `shared/types/`                 │
│           (Telegram SDK glue, haptics, global typings)               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │  HTTPS / Bearer JWT
                               │  (auth flow not yet wired in front/)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   BACK  —  NestJS 11 (Express adapter)               │
├────────────────────┬────────────────────┬────────────────────────────┤
│    AppModule       │    AuthModule      │      PrismaModule (@Global)│
│  `src/app.*`       │  `src/auth/`       │      `src/prisma/`         │
│  (root, health)    │  (Telegram login,  │   (Prisma client +         │
│                    │   JWT issue/verify)│    pg adapter, lifecycle)  │
└────────────────────┴────────────────────┴────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│         PostgreSQL  (Prisma 7, @prisma/adapter-pg + node-pg)         │
│              schema: `roomies back/prisma/schema.prisma`             │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Backend (`roomies back/`)

| Component | Responsibility | File |
|-----------|----------------|------|
| Bootstrap | Nest factory, global ValidationPipe (whitelist + transform), Swagger at `/api`, `BigInt.toJSON` patch, listens on `PORT` | `roomies back/src/main.ts` |
| AppModule | Root module: wires `ConfigModule.forRoot({ isGlobal: true })`, `PrismaModule`, `AuthModule` | `roomies back/src/app.module.ts` |
| AppController | Trivial `GET /` health route returning "Hello World!" | `roomies back/src/app.controller.ts` |
| AuthModule | Registers `JwtModule` async with `JWT_SECRET` from config; exports `AuthService`, `JwtAuthGuard`, `JwtModule` | `roomies back/src/auth/auth.module.ts` |
| AuthController | `POST /auth/telegram` (login via initData), `GET /auth/me` (protected sanity check) | `roomies back/src/auth/auth.controller.ts` |
| AuthService | Verifies initData, upserts `User` by `telegramId`, issues JWT with `expiresIn = JWT_ACCESS_TTL_SECONDS` (default 7d) | `roomies back/src/auth/auth.service.ts` |
| Telegram verifier | Pure function: parses `URLSearchParams`, builds `data_check_string`, HMAC-SHA256 with `WebAppData`-derived secret key, enforces 24h `auth_date` window | `roomies back/src/auth/telegram-init-data.ts` |
| JwtAuthGuard | `CanActivate` that extracts Bearer token, verifies via `JwtService`, attaches `{ id, telegramId: bigint }` to `req.user` | `roomies back/src/auth/jwt-auth.guard.ts` |
| `@CurrentUser()` | Param decorator returning `req.user` populated by the guard | `roomies back/src/auth/current-user.decorator.ts` |
| Auth DTOs | `TelegramLoginDto` (input), `AuthTokensDto` (output) — validated by `class-validator`, documented via `@nestjs/swagger` | `roomies back/src/auth/dto/telegram-login.dto.ts` |
| PrismaModule | Marked `@Global()`, provides and exports `PrismaService` so any module can inject it without re-importing | `roomies back/src/prisma/prisma.module.ts` |
| PrismaService | Extends `PrismaClient` with `PrismaPg` adapter using `DATABASE_URL`; `$connect`/`$disconnect` tied to Nest lifecycle | `roomies back/src/prisma/prisma.service.ts` |

### Frontend (`front/`)

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | HTML shell, font setup, `viewport`/`themeColor` meta, injects `telegram-web-app.js` via `next/script` with `strategy="beforeInteractive"` | `front/app/layout.tsx` |
| Home route | Thin Next.js route: imports and renders `HomeView` from the views layer | `front/app/page.tsx` |
| HomeView | Page composition: header + `<SwipeDeck>` widget; calls `useTelegramWebApp()` for SDK init and theme sync | `front/views/home/ui/HomeView.tsx` |
| SwipeDeck widget | Stitches feature + entity together: takes `RoomieProfile[]`, drives `useSwipeDeck`, renders top-3 `SwipeCard`s and `ActionButtons`, falls back to `EmptyState` | `front/widgets/swipe-deck/ui/SwipeDeck.tsx` |
| EmptyState | Local widget UI shown when deck is exhausted; offers "Start over" callback | `front/widgets/swipe-deck/ui/EmptyState.tsx` |
| swipe-profile feature | Owns the swipe interaction: `useSwipeDeck` hook (stack state, exit animation), `SwipeCard` (pointer drag, threshold, rotate, LIKE/NOPE overlays), `ActionButtons` (pass/like) | `front/features/swipe-profile/` |
| profile entity | Domain model `RoomieProfile`, mock data (`MOCK_PROFILES`), and a pure visual `ProfileCard` (no gestures, accepts `overlay` slot) | `front/entities/profile/` |
| Telegram lib | `getWebApp()`, `useTelegramWebApp()` (calls `ready()`/`expand()`, syncs `themeParams` → CSS variables, listens to `themeChanged`), `haptic()` / `hapticNotify()` wrappers | `front/shared/lib/telegram/` |
| Global types | Ambient `TelegramWebApp` typings on `window.Telegram.WebApp` | `front/shared/types/telegram.d.ts` |

## Pattern Overview

**Overall:** Two-tier client/server split — Telegram Mini App (Next.js App Router on FSD) talks to a NestJS API backed by Prisma + Postgres. JWT-based session, identity bootstrapped from Telegram initData.

**Key Characteristics:**
- Backend: classic Nest modular DI with one shared global Prisma module and an isolated auth module.
- Frontend: strict Feature-Sliced Design — every slice exposes a single `index.ts` barrel; cross-slice imports go through the barrel only.
- Telegram is the source of identity; backend never trusts `initDataUnsafe`, always re-verifies the HMAC.
- BigInt-aware: `telegramId` is `BigInt` end-to-end (Prisma `BigInt`, JWT carries it as string, `BigInt.prototype.toJSON` patched globally).

## Layers

### Backend layers

**Bootstrap / composition root:**
- Location: `roomies back/src/main.ts`, `roomies back/src/app.module.ts`
- Purpose: build the Nest app, apply global pipes, expose Swagger, wire feature modules.

**Feature module (Auth):**
- Location: `roomies back/src/auth/`
- Purpose: encapsulate one bounded capability (login + identity guards).
- Depends on: `PrismaModule` (transitively, via `@Global`), `ConfigModule`, `JwtModule`.
- Used by: future feature modules will import `AuthModule` to consume `JwtAuthGuard`.

**Infrastructure (Prisma):**
- Location: `roomies back/src/prisma/`
- Purpose: single Postgres entry point as an `@Global()` module so every feature module can `constructor(private prisma: PrismaService)` without import lists.

### Frontend layers (FSD, strict top-down dependency rule)

Layer order, top to bottom — each layer may import only from layers *below* it via the slice's `index.ts` barrel:

**`app/`** — Next.js App Router routes
- Purpose: routing, root layout, global CSS, Telegram SDK script tag.
- Location: `front/app/`
- Contains: `layout.tsx`, `page.tsx`, `globals.css`, route segments.
- May import from: `views/`, `widgets/`, `features/`, `entities/`, `shared/`.

**`views/`** — page-level compositions
- Purpose: assemble a full screen from widgets; no business logic.
- Location: `front/views/`
- Existing slices: `home/`.

**`widgets/`** — composite UI blocks
- Purpose: combine one or more features + entities into a reusable section.
- Location: `front/widgets/`
- Existing slices: `swipe-deck/`.

**`features/`** — user-facing actions
- Purpose: own the rules for a single interaction (state hooks live here).
- Location: `front/features/`
- Existing slices: `swipe-profile/`.

**`entities/`** — domain models
- Purpose: types + presentational components for a business entity; never own actions.
- Location: `front/entities/`
- Existing slices: `profile/`.

**`shared/`** — reusable infrastructure
- Purpose: framework glue, SDK wrappers, global typings, design primitives.
- Location: `front/shared/`
- Existing slices: `lib/telegram/`, `types/telegram.d.ts`.

Inside every slice, segments are: `ui/` (React components), `model/` (types, hooks, mocks). The slice's `index.ts` is the single public surface.

## Data Flow

### Telegram login flow (designed; **client side not yet implemented**)

1. Telegram opens the Mini App; `telegram-web-app.js` populates `window.Telegram.WebApp.initData` (signed query string).
2. Client should `POST /auth/telegram` with `{ initData }` — currently no caller exists in `front/`; `HomeView` only invokes `useTelegramWebApp()` for theming.
3. `AuthController.loginTelegram` → `AuthService.loginWithTelegram` (`roomies back/src/auth/auth.service.ts:29`).
4. `verifyTelegramInitData(initData, botToken)` (`roomies back/src/auth/telegram-init-data.ts:28`): sorts params, builds `data_check_string`, HMAC-SHA256 with secret = `HMAC_SHA256("WebAppData", botToken)`, throws `InvalidInitDataError` on hash mismatch or `auth_date` older than 24h.
5. `upsertUser`: looks up `User` by `telegramId` (BigInt). On miss, creates with name from `first_name + last_name` (or `username`/`tg_<id>`) and default `scenario = looking_housing_roomie`; on hit, refreshes `telegramUsername`, `telegramPhotoUrl`, `languageCode`, `lastSeenAt`.
6. Signs JWT payload `{ sub: user.id, tg: user.telegramId.toString() }` with TTL from `JWT_ACCESS_TTL_SECONDS` (default 604800s).
7. Returns `AuthTokensDto { accessToken, expiresIn, userId, telegramId (string), isNew }`.
8. Client persists token, sends `Authorization: Bearer <token>` on subsequent calls.
9. `JwtAuthGuard.canActivate` (`roomies back/src/auth/jwt-auth.guard.ts:23`) verifies and hydrates `req.user = { id, telegramId: bigint }` for `@CurrentUser()`.

### Swipe interaction flow (frontend, in-memory only)

1. `HomeView` mounts, runs `useTelegramWebApp()` to call `WebApp.ready()`/`expand()` and copy `themeParams` to CSS vars (`front/views/home/ui/HomeView.tsx:9`).
2. `<SwipeDeck profiles={MOCK_PROFILES} />` receives mock data straight from the entity layer.
3. `useSwipeDeck(profiles)` (`front/features/swipe-profile/model/use-swipe-deck.ts:21`) tracks `index` and `exitDirection`; `visible = profiles.slice(index, index + 3)`.
4. `SwipeCard` handles pointer drag (`pointerdown/move/up`), computes velocity, and at `|x| > 120px` or `|v| > 500px/s` calls `onSwipe(direction)`.
5. `swipe()` triggers haptic (`hapticNotify('success')` on right, `haptic('light')` on left), sets `exitDirection` to drive the 220ms exit transform, then advances `index`.
6. When `visible.length === 0`, `<EmptyState>` offers `reset()` (sets `index` back to 0).

**State Management:**
- Backend: stateless (JWT) — all persistence in Postgres via Prisma.
- Frontend: local React state only (`useState` inside hooks/components). No client store, no server cache, no SWR/Query yet.

## Data Model (high level)

Source of truth: `roomies back/prisma/schema.prisma`. All tables use `snake_case` via `@map`; Prisma models stay `PascalCase`.

**Geography**
- `City` — `id`, `name`, `countryCode` (default `RU`); has many `District`, `User`, `Squad`.
- `District` — belongs to `City`; many-to-many with `User` via `UserDistrict`, with `Squad` via `SquadDistrict`.

**Users & identity**
- `User` — central entity. Telegram is the primary login: `telegramId BigInt @unique` (`@map("telegram_id")`), plus optional `telegramUsername`, `telegramPhotoUrl`, `languageCode`. Optional `email` and `phone` are both `@unique`. Mandatory `name` and `scenario` (`ScenarioType` enum: `looking_housing_roomie | has_housing_seeking_roomie | looking_roomie_find_housing | squad`).
- Hard filters on the user: `budgetMin/Max`, `moveInDate`, `stayDurationMonths`, `smokingOk`, `petsOk`, `guestsPref` (`rarely|sometimes|often`).
- Lifestyle scales (`Decimal(3,2)`, range 0.0–1.0): `noiseLevel`, `cleanliness`, `sleepSchedule`, `socialLevel`, `workFromHome` — derived from the Vibe Quiz.
- Trust: `roomieScore`, `isPhoneVerified`, `isSelfieVerified`, `isStudentVerified`.
- Onboarding progress: `onboardingStep`, `onboardingCompleted`, `quizCompleted`.
- Lifecycle: `boostedUntil`, `isActive`, `lastSeenAt`, `createdAt`, `updatedAt`.
- Side tables: `UserPhoto` (ordered photos), `UserVibeTag` (M2M to `VibeTag`), `UserDistrict`.

**Vibe Quiz**
- `QuizQuestion` — `category`, `questionText`, `options` (Json: `[{code, label, featureVector}]`), `displayOrder`, `isActive`.
- `UserQuizAnswer` — one row per `(userId, questionId)`, stores `optionCode` and normalized `answerValue Decimal(3,2)`.
- `VibeEmbedding` — 1:1 with `User`, holds aggregated `vector Float[]` (designed to be swapped for `pgvector` later) plus `updatedAt`.

**Matching pipeline**
- `Swipe` — `actor → target` with `action` (`like|super_like|save|pass`); unique on `(actorId, targetId)`.
- `Match` — pair of users (`user1Id < user2Id` invariant enforced at app layer — Prisma can't express CHECK), with score breakdown: `matchScore`, `hardScore`, `lifestyleScore`, `vibeScore`, `behavioralScore`. Human-readable `matchReasons` / `matchRisks` as `Json`. `isActive` flag.
- `BehavioralEvent` — append-only signal log (`liked|messaged|replied|called|...`) used to compute `behavioralScore`.

**Chat & coordination**
- `Chat` — 1:1 with `Match`.
- `Message` — `BigInt` id; `messageType` (`text|voice|system|call_invite`); soft-delete via `deletedAt`; `metadata` Json for voice duration / call links.
- `ChatRead` — per-(chat, user) `lastReadAt` (more precise than per-message read flags).
- `CallInvite` — proposes time slots (`proposedTimes` Json array), confirmed time, `CallStatus`.
- `RoomieAgreement` + `AgreementItem` — collaborative house-rules doc with `AgreementStatus` (`draft|accepted|declined`).
- `PostMatchFeedback` — single-tap "did the vibe match?" per `(matchId, userId)`.

**Squad mode**
- `Squad` — group searching together (`maxMembers` default 4).
- `SquadMember` — composite key, `SquadRole` (`leader|member`).
- `SquadDistrict` — preferred areas.
- `SquadInvite` — `SquadInviteStatus` (`pending|accepted|declined|expired`).

**Trust & safety**
- `Verification` — one per (`userId`, `VerificationType`: `phone|selfie|student_email`), `VerificationStatus`, `externalRef` (e.g. S3 key — PII never stored in DB).
- `Report` — `ReportReason` (`spam|fake|abuse|suspicious|other`), `ReportStatus`.
- `Block` — composite key `(blockerId, blockedId)`.

**Monetization & notifications**
- `Boost` — time-bounded visibility boost.
- `Purchase` — `productType`, `amountCents`, `currency` (default `RUB`), `store`, `storeTxId` (`@unique`).
- `PushToken` — per device (`platform: ios|android|web`).
- `NotificationPreference` — 1:1 with `User`, granular toggles (`newMatch`, `newMessage`, `callReminder`, `nearbyPeople`, `marketing`).

## Key Abstractions

**`User.telegramId` as identity anchor:**
- BigInt, unique, immutable; everything else (email/phone) is optional.
- Backend and JWT both treat it as a string outside of Prisma to dodge JSON BigInt issues (`roomies back/src/main.ts:7`).

**`ParsedInitData`:**
- Pure data carrier produced by `verifyTelegramInitData`; isolates Telegram-protocol parsing from Nest plumbing (`roomies back/src/auth/telegram-init-data.ts:13`).

**`RoomieProfile`:**
- Frontend's single profile shape used across entity, feature, and widget layers (`front/entities/profile/model/types.ts`). Currently UI-shaped (formatted `budget` as `"40–55 ₽"`) — will diverge from the Prisma `User` shape once the API is wired and a DTO layer is introduced.

**FSD slice barrel (`index.ts`):**
- Every slice has exactly one public entry. Example: `front/features/swipe-profile/index.ts` exports `SwipeCard`, `ActionButtons`, `useSwipeDeck`, `SWIPE_EXIT_DURATION_MS`, and types. Deep imports across slices are forbidden by convention.

## Entry Points

**Backend HTTP server:**
- Location: `roomies back/src/main.ts`
- Triggers: `npm run start` / `start:dev` / `start:prod`.
- Responsibilities: build Nest app, register `ValidationPipe` (whitelist + transform), mount Swagger UI at `/api`, listen on `process.env.PORT ?? 3000`.

**Frontend page entry:**
- Location: `front/app/page.tsx`
- Triggers: any request to `/`.
- Responsibilities: thin route shell — renders `<HomeView />` from `views/home`.

**Frontend layout entry:**
- Location: `front/app/layout.tsx`
- Triggers: every route render in the App Router.
- Responsibilities: HTML shell, font loading, viewport/theme metadata, injects Telegram SDK script before interactive code.

## Architectural Constraints

- **Identity is Telegram-first.** `User.telegramId` is the only required identity column; `email` and `phone` are nullable. Any auth path that bypasses `verifyTelegramInitData` would create unverified accounts — don't add one without rate limiting and re-verification.
- **`auth_date` window = 24h.** Tokens older than `DEFAULT_MAX_AGE_SECONDS = 86400` are rejected (`roomies back/src/auth/telegram-init-data.ts:26`). Mini App must re-issue initData before this expires.
- **BigInt everywhere identity flows.** `User.telegramId` is BigInt; JWT carries it as a string under the `tg` claim; `main.ts` patches `BigInt.prototype.toJSON` so Nest can serialize it. Don't downcast to `number`.
- **Match invariant `user1Id < user2Id`.** Prisma cannot express CHECK constraints; the application layer must enforce ordering before insert (noted in schema comment at `schema.prisma:338`).
- **PII storage.** Verification artifacts (selfies, IDs) are kept out of the DB — only `externalRef` (e.g. S3 key) is stored (`Verification` model).
- **Global state on the backend.** `PrismaModule` is `@Global()` — the only intentional global. Everything else must declare its imports explicitly.
- **No server state on the frontend yet.** All data flows from `MOCK_PROFILES`; no fetch layer, no auth context, no token storage. Treat the current frontend as a UI prototype.
- **Strict FSD layering.** A feature may not import from another feature, a widget, a view, or `app/`. A widget may not import from another widget. Cross-slice imports must go through the slice's `index.ts`.

## Anti-Patterns

### Reaching into another FSD slice's internals

**What happens:** importing `front/features/swipe-profile/model/use-swipe-deck` directly instead of from `@/features/swipe-profile`.
**Why it's wrong:** Breaks the slice's public contract; bypasses the barrel that documents what is meant to leak out.
**Do this instead:** Add the symbol to the slice's `index.ts` (see `front/features/swipe-profile/index.ts`) and import from the slice root.

### Trusting `initDataUnsafe` on the backend

**What happens:** Reading `initDataUnsafe.user` instead of re-verifying the signed `initData`.
**Why it's wrong:** `initDataUnsafe` is parsed but not validated — any client can forge it.
**Do this instead:** Always call `verifyTelegramInitData(rawInitData, botToken)` (`roomies back/src/auth/telegram-init-data.ts:28`) and treat its return as the only source of truth.

### Using `number` for `telegramId`

**What happens:** Casting `tg.id` to `number` in JS or storing it in an `Int` column.
**Why it's wrong:** Telegram user ids can exceed Int32; precision loss creates account-collision risk.
**Do this instead:** Keep it `BigInt` in Prisma, string in JSON, BigInt in JWT-decoded code (see `JwtAuthGuard` rehydrating `BigInt(payload.tg)`).

### Putting business logic in `views/` or `app/`

**What happens:** Calling `fetch()` or transforming domain data inside `HomeView` / `page.tsx`.
**Why it's wrong:** Views must stay thin compositions; routes are routing-only. Business rules belong in `features/` (actions) or `entities/` (domain shape).
**Do this instead:** Encapsulate state and side effects in a feature hook (mirror `useSwipeDeck`).

## Error Handling

**Backend strategy:**
- Domain errors thrown as Nest exceptions (`UnauthorizedException`) — automatically translated to HTTP responses.
- Validation errors handled by global `ValidationPipe` (`main.ts:14`) — rejects unknown fields (`forbidNonWhitelisted`) and coerces types.
- `InvalidInitDataError` (custom) is caught in `AuthService.loginWithTelegram` and rethrown as `UnauthorizedException` carrying the original reason string.

**Frontend strategy:**
- None yet. No error boundaries, no try/catch around side effects, no API failure UX (nothing calls the API).

## Cross-Cutting Concerns

**Logging:** Default Nest logger only; no structured logging, no request id, no Sentry.
**Validation:** `class-validator` decorators on DTOs (`TelegramLoginDto`) + global `ValidationPipe`.
**Authentication:** `JwtAuthGuard` applied per-route via `@UseGuards(JwtAuthGuard)`; `@CurrentUser()` exposes the decoded principal.
**API docs:** `@nestjs/swagger` decorators on controllers/DTOs, UI mounted at `/api` (`main.ts:29`).
**Telegram theming:** Frontend syncs `WebApp.themeParams` → CSS custom properties (`--tg-bg`, `--tg-text`, ...) on `<html>` so Tailwind/inline styles inherit Telegram's palette (`front/shared/lib/telegram/use-telegram-web-app.ts:14`).
**Haptics:** Centralized in `front/shared/lib/telegram/haptic.ts`; features call `haptic()` / `hapticNotify()` rather than poking `window.Telegram` directly.

---

*Architecture analysis: 2026-05-22*
