# Walking Skeleton — Phase 1: Onboarding

**Phase:** 1  
**Created:** 2026-06-07  
**Purpose:** Record the architectural decisions made in the Walking Skeleton (Plan 01) that all subsequent plans build on without renegotiating.

---

## What the Walking Skeleton Proves

The thinnest possible end-to-end slice demonstrating the full stack is wired:

1. Frontend authenticates via Telegram initData → receives JWT
2. Authenticated frontend calls `GET /onboarding/status` with JWT Bearer header
3. Backend validates JWT, queries Postgres, returns `{ onboardingStep: 0, onboardingCompleted: false, ... }`
4. Frontend renders based on the response (onboarding gate in HomeView)
5. Seed data exists: Cities, Districts, QuizQuestions (IDs 1–10), VibeTags

This is not a smoke test — it is a **structural proof** that auth, routing, database, and frontend all work together in the full stack before the feature work begins.

---

## Architectural Decisions

### 1. ORM & Database

| Decision | Value |
|----------|-------|
| ORM | Prisma 7 (`@prisma/client`) |
| Database | PostgreSQL (via `@prisma/adapter-pg`) |
| Migration tool | `prisma migrate dev` |
| Initial migration name | `init` |
| Seed entry point | `roomies back/prisma/seed.ts` |
| Prisma client import | `@prisma/client` (confirmed in `prisma.service.ts`) |
| Client generation output | `node_modules/@prisma/client` (standard, adapter-pg pattern) |

### 2. Authentication

| Decision | Value |
|----------|-------|
| Auth mechanism | Telegram initData HMAC verification → JWT |
| JWT library | `@nestjs/jwt` with `JwtService` |
| JWT secret env | `JWT_SECRET` |
| Token storage | `localStorage` via `token-storage.ts` in `shared/lib/api` |
| Guard | `JwtAuthGuard` exported from `AuthModule` |
| User extraction | `@CurrentUser() user: { id: number }` decorator |
| telegramId type | Always `BigInt` in backend; serialized as `string` in API responses |

### 3. Backend Framework & Module Structure

| Decision | Value |
|----------|-------|
| Framework | NestJS 11 |
| Module pattern | One module per feature (`onboarding/`, `geo/`, `vibe-tags/`) |
| Global modules | `PrismaModule` (`@Global()`), `ConfigModule` (`isGlobal: true`) |
| Validation | Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| API docs | Swagger at `/api` route |
| Port | `process.env.PORT ?? 3000` |

### 4. Frontend Framework & Architecture

| Decision | Value |
|----------|-------|
| Framework | Next.js 16 (App Router) |
| UI library | React 19 |
| Architecture | Feature-Sliced Design (FSD) — strict one-way dependency |
| Styling | Tailwind v4 CSS-first (`@theme inline` in `globals.css`, no `tailwind.config.js`) |
| State management | Local `useState` / `useReducer` — no global store |
| HTTP client | `apiFetch` from `shared/lib/api/client.ts` |
| Path alias | `@/*` → `front/*` |

### 5. Navigation

| Decision | Value |
|----------|-------|
| Onboarding routing | Single route `/`, state machine in `useOnboarding` hook |
| Back navigation | Telegram BackButton API (`show()`/`hide()`/`onClick()`/`offClick()`) |
| No URL routes | No `/onboarding/scenario`, `/onboarding/location`, etc. |
| Onboarding gate | `HomeView` checks `onboardingCompleted`; renders `<OnboardingFlow>` or `<SwipeDeck>` |

### 6. Directory Layout

```
roomies/
├── roomies back/
│   ├── prisma/
│   │   ├── schema.prisma          — full schema (all tables, no migration yet)
│   │   ├── seed.ts                — created in Plan 01 (cities, districts, quiz, tags)
│   │   └── migrations/            — created by `prisma migrate dev --name init`
│   └── src/
│       ├── auth/                  — JWT auth (exists)
│       ├── prisma/                — PrismaService (exists, @Global)
│       ├── onboarding/            — created in Plan 02
│       ├── geo/                   — created in Plan 02
│       ├── vibe-tags/             — created in Plan 02
│       └── app.module.ts          — updated in Plan 02
└── front/
    ├── app/
    │   ├── page.tsx               — entry point (exists)
    │   └── globals.css            — design tokens (exists, fixed light palette)
    ├── views/home/ui/HomeView.tsx — updated in Plan 03 (onboarding gate)
    ├── features/
    │   ├── auth/                  — JWT auth hook (exists)
    │   └── onboarding/            — created in Plans 03 & 04
    │       ├── ui/
    │       │   ├── OnboardingFlow.tsx
    │       │   └── steps/
    │       │       ├── ScenarioStep.tsx   (Plan 03)
    │       │       ├── LocationStep.tsx   (Plan 03)
    │       │       ├── BudgetStep.tsx     (Plan 03)
    │       │       ├── DealbreakersStep.tsx (Plan 03)
    │       │       ├── QuizStep.tsx       (Plan 04)
    │       │       ├── ProfileStep.tsx    (Plan 04)
    │       │       └── DoneStep.tsx       (Plan 04)
    │       ├── model/
    │       │   ├── use-onboarding.ts
    │       │   ├── types.ts
    │       │   └── quiz-questions.ts      (Plan 04)
    │       ├── api/onboarding-api.ts
    │       └── index.ts
    └── shared/lib/api/
        ├── geo.ts                 — created in Plan 03
        └── vibe-tags.ts           — created in Plan 04
```

### 7. Design System

| Decision | Value |
|----------|-------|
| Component library | None (custom components only, no shadcn) |
| Icons | Inline SVG (20×20 or 18×18 viewBox, stroke-based) |
| Font | Geist Sans via `next/font/google` |
| Color palette | Fixed light palette (`#f6f6f1` bg, `#c8f36a` accent, `#d6cffa` lavender) |
| Telegram theme sync | `useTelegramWebApp` runs but Telegram CSS variables NOT used for semantic colors |
| Height | Always `h-dvh`, never `h-screen` |
| Max width | `max-w-md` container |

### 8. Seed Data Contract

| Table | Count | Key Constraint |
|-------|-------|----------------|
| `cities` | 7 | IDs 1–7 (Москва, СПб, Казань, Новосибирск, Екатеринбург, Краснодар, Нижний Новгород) |
| `districts` | ~35–50 | 5–8 districts per city, cityId FK |
| `quiz_questions` | 10 | IDs **1–10 EXACTLY** — must match `QUIZ_QUESTIONS` constant in frontend |
| `vibe_tags` | 20–25 | Sequential IDs, unique labels |

**Critical invariant:** `QuizQuestion` IDs in DB must be 1–10. The frontend `QUIZ_QUESTIONS` constant references these IDs in `POST /onboarding/quiz` answers. Mismatch causes FK violation.

### 9. Environment Variables Required

| Variable | Required By | Source |
|----------|-------------|--------|
| `DATABASE_URL` | Prisma | Postgres connection string |
| `JWT_SECRET` | AuthModule | Any random secret ≥32 chars |
| `TELEGRAM_BOT_TOKEN` | AuthService (HMAC verify) | Telegram Bot API |
| `NEXT_PUBLIC_API_URL` | frontend `apiFetch` | Backend URL (tunnel URL for Telegram testing) |

---

## Proof of Life Verification

After Plan 01 completes, these commands confirm the skeleton is alive:

```bash
# 1. Migration applied
cd "roomies back" && npx prisma migrate status
# Expected: "All migrations have been applied"

# 2. Seed data present
cd "roomies back" && npx prisma studio
# Or: SELECT COUNT(*) FROM quiz_questions; → 10 rows

# 3. Backend responds
curl http://localhost:3000/api
# Expected: Swagger JSON (200)

# 4. Auth endpoint reachable
curl -X POST http://localhost:3000/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData": "test"}'
# Expected: 401 (invalid initData — correct, proves routing works)

# 5. Onboarding status with JWT
curl -X GET http://localhost:3000/onboarding/status \
  -H "Authorization: Bearer <valid_jwt>"
# Expected: 200 with { onboardingStep: 0, onboardingCompleted: false, ... }
```

---

*Walking Skeleton recorded: 2026-06-07*
