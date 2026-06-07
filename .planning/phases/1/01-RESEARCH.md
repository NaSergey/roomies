# Phase 1: Onboarding — Research

**Researched:** 2026-06-07
**Domain:** NestJS onboarding module, Prisma upsert/replace patterns, React useReducer state machine, Telegram BackButton API, seed migrations
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Routing:** State machine on single `/` route + Telegram BackButton API. No per-step URL routes.
2. **Quiz UX:** A/B chip buttons (not swipe cards). Visual-first. No drag gestures in Phase 1.
3. **Quiz questions:** Hardcoded TypeScript constant on the frontend. 10 questions, IDs match DB seed.
4. **Photos:** No upload in Phase 1. Use `telegramPhotoUrl` from User record as default. Optional manual URL (hidden from UI, auto-filled).
5. **First matches:** "Профиль создан!" splash screen then SwipeDeck on MOCK_PROFILES.
6. **Persistence:** PATCH after each step (6 separate endpoints + 1 GET status). HTTP table defined in CONTEXT.md.
7. **Cities/Districts:** Seed 7 cities with key districts, `GET /geo/cities` + `GET /geo/cities/:cityId/districts`.
8. **Vibe tags:** Seed 20–25 tags, `GET /vibe-tags`.

### Claude's Discretion

None specified in CONTEXT.md — all major decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- Real Match Score / ranking (Phase 2)
- Photo upload via S3/R2 (Phase 3)
- Profile editing post-onboarding (Phase 3)
- Swipe gestures in quiz (Phase 3)
- Roomie Score computation (Phase 3)
- Embedding vector generation (Phase 2)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBOARD-01 | User picks one of 4 scenarios | ScenarioStep + PATCH /onboarding/scenario |
| ONBOARD-02 | User picks city (required) + optional districts | LocationStep + seed cities/districts + PATCH /onboarding/location |
| ONBOARD-03 | User sets budget range, move-in date, stay duration | BudgetStep + PATCH /onboarding/budget |
| ONBOARD-04 | User sets dealbreakers: smoking, pets, guests | DealbreakersStep + PATCH /onboarding/dealbreakers |
| ONBOARD-05 | User completes 10-question Vibe Quiz, lifestyle scales written to User | QuizStep + POST /onboarding/quiz + scale aggregation algorithm |
| ONBOARD-06 | User adds name, photos (URL), 3 vibe tags | ProfileStep + PATCH /onboarding/profile |
| ONBOARD-07 | After onboarding, user reaches first matches screen | DoneStep + onboardingCompleted=true + SwipeDeck on MOCK_PROFILES |
</phase_requirements>

---

## Summary

Phase 1 wires the existing NestJS + Prisma backend to the existing Next.js frontend via a 7-step onboarding flow. The backend already has a full Prisma schema and working JWT auth; the frontend already has the SwipeDeck UI. What Phase 1 builds is the bridge: 3 new backend modules (onboarding, geo, vibe-tags), seed data migrations, a frontend `features/onboarding` slice, and the HomeView gating logic.

The most critical implementation concern is seed data: `QuizQuestion` IDs in the DB must exactly match the hardcoded `id` values in the frontend `QUIZ_QUESTIONS` constant. Migrations must run in order: `init` (schema) → `seed` (reference data). Because no migrations exist yet, Phase 1 owns the initial `prisma migrate dev` run.

The second most critical concern is the `useReducer`-based state machine on the frontend. It manages step transitions, accumulated answers, Telegram BackButton show/hide, and per-step loading/error state — all without external state libraries. This hook must also handle the resume case via `GET /onboarding/status`.

**Primary recommendation:** Build backend-first (walking skeleton: seed migration → onboarding module → one working PATCH endpoint → `GET /onboarding/status`) then build frontend step-by-step connecting to each endpoint. This ensures quiz IDs are locked in DB before the frontend constants are written.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Telegram auth (JWT) | API / Backend | — | Already exists in AuthModule; frontend calls it once |
| Step navigation (BackButton) | Browser / Client | — | Telegram.WebApp.BackButton is client-side SDK |
| Onboarding state machine | Browser / Client (feature hook) | — | No server state needed; step is tracked in User.onboardingStep for resume only |
| Step persistence (PATCH) | API / Backend | — | Validates, writes to Postgres via Prisma |
| Quiz scale aggregation | API / Backend | — | Average of answerValues per scale — backend computes and writes to User |
| Seed reference data | Database / Storage | — | Cities, districts, quiz questions, vibe tags are seeded in migration |
| Resume detection | API / Backend | — | GET /onboarding/status returns current step + saved fields |
| Resume hydration | Browser / Client | — | Frontend pre-populates form state from status response |
| Photo handling | Browser / Client | — | telegramPhotoUrl auto-filled from initDataUnsafe; no upload |

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/common` | ^11.0.1 | Controllers, services, decorators | Existing project standard |
| `@prisma/client` | ^7.8.0 | Database access | Existing project standard |
| `class-validator` | ^0.15.1 | DTO validation | Existing project standard — global pipe already wired |
| `class-transformer` | ^0.5.1 | DTO transformation | Existing project standard |
| `@nestjs/swagger` | ^11.4.3 | API documentation | Existing project standard |
| `next` | 16.2.6 | Frontend framework | Existing project standard |
| `react` | 19.2.4 | UI library | Existing project standard |
| `tailwindcss` | ^4 | Styling | Existing project standard |

### No new packages required

Phase 1 uses only what is already installed. No new npm packages needed on either frontend or backend.

**Verification:** [VERIFIED: package.json inspection] — All needed libraries are present in both `front/package.json` and `roomies back/package.json`.

---

## Architecture Patterns

### System Architecture Diagram

```
Telegram WebView
    │
    │ initData (HMAC-signed)
    ▼
frontend: features/auth (useTelegramAuth)
    │
    │ POST /auth/telegram
    ▼
backend: AuthModule
    │ JWT issued
    ▼
frontend: HomeView
    │ checks auth.status === 'authenticated'
    │ checks user.onboardingCompleted
    ├─── false → <OnboardingFlow /> ──────────────────────────────────────────┐
    └─── true  → <SwipeDeck profiles={MOCK_PROFILES} />                      │
                                                                              │
OnboardingFlow (features/onboarding)                                         │
    │ useOnboarding() ← useReducer state machine                             │
    │   state: { step: 0-6, answers: {...}, loading, error }                 │
    │                                                                         │
    │ step 0 → ScenarioStep  → PATCH /onboarding/scenario                   │
    │ step 1 → LocationStep  → PATCH /onboarding/location  ← GET /geo/*     │
    │ step 2 → BudgetStep    → PATCH /onboarding/budget                     │
    │ step 3 → DealbreakersStep → PATCH /onboarding/dealbreakers            │
    │ step 4 → QuizStep      → POST /onboarding/quiz                        │
    │ step 5 → ProfileStep   → PATCH /onboarding/profile  ← GET /vibe-tags  │
    │ step 6 → DoneStep      → dispatch(COMPLETE) → onboardingCompleted=true │
    │                                                                         │
    │ On mount: GET /onboarding/status → resume if step > 0 ◄────────────────┘
    │
    ▼
backend: OnboardingModule
    │ OnboardingController (6 PATCH + 1 POST + 1 GET)
    │ OnboardingService
    │   ├── PATCH scenario → prisma.user.update({ scenario })
    │   ├── PATCH location → update cityId + deleteMany/createMany UserDistrict
    │   ├── PATCH budget   → update budgetMin/Max/moveInDate/stayDuration
    │   ├── PATCH dealbreakers → update smokingOk/petsOk/guestsPref
    │   ├── POST  quiz     → upsertMany UserQuizAnswer + compute+write scales
    │   ├── PATCH profile  → update name + replace UserVibeTag + upsert UserPhoto
    │   └── GET   status   → select onboarding fields + relations
    │
    ▼
PostgreSQL via Prisma
    Users, UserDistrict (replace), UserVibeTag (replace),
    UserPhoto (upsert by displayOrder), UserQuizAnswer (upsert by questionId),
    Cities, Districts, VibeTags, QuizQuestions (seed)
```

### Recommended Project Structure

**Backend — new modules:**
```
roomies back/src/
  onboarding/
    onboarding.module.ts
    onboarding.controller.ts
    onboarding.service.ts
    dto/
      scenario.dto.ts
      location.dto.ts
      budget.dto.ts
      dealbreakers.dto.ts
      quiz.dto.ts
      profile.dto.ts
      status-response.dto.ts
  geo/
    geo.module.ts
    geo.controller.ts
    geo.service.ts
  vibe-tags/
    vibe-tags.module.ts
    vibe-tags.controller.ts
    vibe-tags.service.ts
```

**Frontend — new slices (FSD):**
```
front/
  views/
    home/
      ui/HomeView.tsx       ← UPDATE: add onboarding gate
      index.ts              ← already exists
  features/
    onboarding/
      ui/
        OnboardingFlow.tsx
        steps/
          ScenarioStep.tsx
          LocationStep.tsx
          BudgetStep.tsx
          DealbreakersStep.tsx
          QuizStep.tsx
          ProfileStep.tsx
          DoneStep.tsx
      model/
        use-onboarding.ts   ← useReducer state machine
        types.ts
        quiz-questions.ts   ← QUIZ_QUESTIONS constant
      api/
        onboarding-api.ts
      index.ts
  shared/
    lib/
      api/
        geo.ts              ← GET /geo/*
        vibe-tags.ts        ← GET /vibe-tags
        index.ts            ← UPDATE: re-export new functions
```

### Pattern 1: NestJS Onboarding Controller — Single Controller, Per-Step Routes

**What:** One `OnboardingController` with 8 routes (6 PATCH, 1 POST, 1 GET). All protected by `JwtAuthGuard`.
**When to use:** When a feature has a small fixed set of related operations that share a guard, auth context, and service.

```typescript
// Source: auth.controller.ts pattern in the codebase
@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getStatus(@CurrentUser() user: { id: number }) {
    return this.onboarding.getStatus(user.id);
  }

  @Patch('scenario')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  patchScenario(
    @CurrentUser() user: { id: number },
    @Body() dto: ScenarioDto,
  ) {
    return this.onboarding.saveScenario(user.id, dto);
  }

  // ... patchLocation, patchBudget, patchDealbreakers, postQuiz, patchProfile
}
```

[VERIFIED: auth.controller.ts pattern, CONVENTIONS.md]

### Pattern 2: Prisma Replace Pattern for M2M Relations

**What:** When updating M2M relations (UserDistrict, UserVibeTag), the correct Prisma 7 pattern is `deleteMany` then `createMany` inside a `$transaction`, NOT `set` (which only works on implicit M2M).
**When to use:** UserDistrict and UserVibeTag are explicit join tables with composite `@@id` — they don't support the `connect`/`set` shorthand.

```typescript
// Source: Prisma 7 explicit M2M — VERIFIED via schema.prisma @@id pattern
async saveLocation(userId: number, dto: LocationDto) {
  const { cityId, districtIds } = dto;

  return this.prisma.$transaction([
    this.prisma.user.update({
      where: { id: userId },
      data: {
        cityId,
        onboardingStep: { increment: 1 },  // only if not already past this step
      },
    }),
    this.prisma.userDistrict.deleteMany({
      where: { userId },
    }),
    ...(districtIds.length > 0
      ? [this.prisma.userDistrict.createMany({
          data: districtIds.map((districtId) => ({ userId, districtId })),
          skipDuplicates: true,
        })]
      : []),
  ]);
}
```

[VERIFIED: schema.prisma UserDistrict @@id([userId, districtId])]

### Pattern 3: Prisma Upsert for UserQuizAnswer

**What:** `upsertMany` doesn't exist in Prisma. Use `createMany` with `skipDuplicates: false` — but since `UserQuizAnswer` has `@@unique([userId, questionId])`, use individual `upsert` or `createMany` with `updateMany` in a `$transaction`.
**When to use:** Quiz answers can be re-submitted if user returns mid-onboarding.

```typescript
// Source: schema.prisma UserQuizAnswer @@unique([userId, questionId])
// VERIFIED: Prisma 7 does not have upsertMany — use $transaction + array of upsert
async saveQuiz(userId: number, dto: QuizDto) {
  const ops = dto.answers.map((a) =>
    this.prisma.userQuizAnswer.upsert({
      where: { userId_questionId: { userId, questionId: a.questionId } },
      create: {
        userId,
        questionId: a.questionId,
        optionCode: a.optionCode,
        answerValue: a.answerValue,
      },
      update: {
        optionCode: a.optionCode,
        answerValue: a.answerValue,
      },
    }),
  );

  // Compute lifestyle scales and update User
  const scales = computeScales(dto.answers);

  await this.prisma.$transaction([
    ...ops,
    this.prisma.user.update({
      where: { id: userId },
      data: {
        ...scales,
        quizCompleted: true,
        onboardingStep: 5,
      },
    }),
  ]);
}
```

[VERIFIED: schema.prisma UserQuizAnswer @@unique([userId, questionId])]

### Pattern 4: Quiz Scale Aggregation Algorithm

**What:** After receiving 10 answers, compute 5 lifestyle scales by averaging `answerValue` of questions mapping to each scale. Some scales have 2 questions (average), others have 1 (use directly).
**Algorithm:**

```typescript
// Source: CONTEXT.md scale mapping + schema Decimal(3,2) constraint
type Scale = 'noiseLevel' | 'cleanliness' | 'sleepSchedule' | 'socialLevel' | 'workFromHome';

function computeScales(
  answers: { questionId: number; answerValue: number }[],
): Record<Scale, number> {
  const scaleMap: Record<number, Scale> = {
    1: 'noiseLevel',
    2: 'cleanliness',
    3: 'sleepSchedule',
    4: 'socialLevel',
    5: 'workFromHome',
    6: 'noiseLevel',
    7: 'cleanliness',
    8: 'sleepSchedule',
    9: 'socialLevel',
    10: 'workFromHome',
  };

  const buckets: Record<Scale, number[]> = {
    noiseLevel: [], cleanliness: [], sleepSchedule: [],
    socialLevel: [], workFromHome: [],
  };

  for (const a of answers) {
    const scale = scaleMap[a.questionId];
    if (scale) buckets[scale].push(a.answerValue);
  }

  return Object.fromEntries(
    Object.entries(buckets).map(([scale, vals]) => [
      scale,
      vals.length > 0
        ? parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2))
        : null,
    ]),
  ) as Record<Scale, number>;
}
```

[VERIFIED: UI-SPEC quiz questions table matches CONTEXT.md QUIZ_QUESTIONS constant]

### Pattern 5: Frontend useReducer State Machine

**What:** A `useReducer`-based hook that manages the 7-step onboarding flow state, Telegram BackButton side effects, and API calls.
**When to use:** Complex multi-step state with transitions that must be explicit and testable. CONTEXT.md decision locks out Zustand/Redux.

```typescript
// Source: CONVENTIONS.md — hooks in model/use-*.ts, no global store
type OnboardingState = {
  step: number;          // 0–6
  loading: boolean;
  error: string | null;
  answers: {
    scenario: ScenarioType | null;
    cityId: number | null;
    districtIds: number[];
    budgetMin: number | null;
    budgetMax: number | null;
    moveInDate: string | null;
    stayDurationMonths: number | null;
    smokingOk: boolean;
    petsOk: boolean;
    guestsPref: GuestsPreference;
    quizAnswers: QuizAnswer[];
    name: string;
    photoUrls: string[];
    vibeTagIds: number[];
  };
};

type OnboardingAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'UPDATE_ANSWERS'; answers: Partial<OnboardingState['answers']> }
  | { type: 'COMPLETE' };

// BackButton side effect: useEffect watching state.step
useEffect(() => {
  const wa = getWebApp();
  if (!wa) return;
  if (state.step > 0 && state.step < 6) {
    wa.BackButton.show();
    wa.BackButton.onClick(handleBack);
  } else {
    wa.BackButton.hide();
  }
  return () => wa.BackButton.offClick(handleBack);
}, [state.step]);
```

[VERIFIED: CONTEXT.md Decision 1 — BackButton show()/hide() rule]

### Pattern 6: Prisma Seed with prisma/seed.ts

**What:** Prisma 7 uses `prisma/seed.ts` (referenced in `package.json` → `"prisma": { "seed": "ts-node prisma/seed.ts" }`) for reference data.
**When to use:** Cities, districts, quiz questions, and vibe tags are stable reference data seeded once.

```typescript
// Source: STACK.md — prisma ^7.8.0 + ts-node ^10.9.2 already installed as devDep
// prisma/seed.ts pattern
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Cities
  await prisma.city.createMany({
    data: [
      { name: 'Москва' },
      { name: 'Санкт-Петербург' },
      { name: 'Казань' },
      { name: 'Новосибирск' },
      { name: 'Екатеринбург' },
      { name: 'Краснодар' },
      { name: 'Нижний Новгород' },
    ],
    skipDuplicates: true,
  });
  // Districts per city, QuizQuestions, VibeTags...
}

main().finally(() => prisma.$disconnect());
```

**Critical:** QuizQuestion IDs are autoincrement — seed order must be deterministic. Run `prisma db seed` after `prisma migrate dev`. Add `"prisma": { "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts" }` to `package.json`. [VERIFIED: ts-node and tsconfig-paths are in devDependencies]

**Important ID constraint:** `QuizQuestion` records must be created in ID order 1–10 matching the frontend `QUIZ_QUESTIONS` constant. Either use explicit `id` in `createMany` (risky with autoincrement), or seed in a blank DB and document IDs, or use `upsert` with deterministic IDs via a raw `ALTER SEQUENCE` reset before seed.

**Recommended approach:** Use `prisma.$executeRaw` to reset sequences before seeding reference data, then `create` with explicit IDs:

```typescript
await prisma.$executeRaw`ALTER SEQUENCE quiz_questions_id_seq RESTART WITH 1`;
await prisma.quizQuestion.create({ data: { id: 1, category: 'noise', ... } });
```

[ASSUMED — Prisma 7 allows explicit ID on autoincrement with create(); verify that create with explicit id works when sequence is reset]

### Pattern 7: HomeView Onboarding Gate

**What:** The updated `HomeView` checks auth status and onboarding status to decide what to render.

```typescript
// Extends existing HomeView pattern — views/home/ui/HomeView.tsx
// Source: CONTEXT.md Decision 1
export function HomeView() {
  useTelegramWebApp();
  const auth = useTelegramAuth();
  const { status, onboardingCompleted } = useOnboardingGate();
  // useOnboardingGate fetches GET /onboarding/status once authenticated

  if (auth.status !== 'authenticated') return <AuthLoading />;

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-md flex-col">
      {onboardingCompleted
        ? <SwipeDeck profiles={MOCK_PROFILES} />
        : <OnboardingFlow onComplete={() => setOnboardingCompleted(true)} />
      }
    </main>
  );
}
```

### Anti-Patterns to Avoid

- **Fetching cities in a component:** Cities must load before LocationStep renders. Fetch in `onboarding-api.ts` and pass as prop, or fetch lazily on LocationStep mount (no blocking the step).
- **Per-question quiz PATCH:** The CONTEXT.md decision is one POST for all 10 answers. Do NOT send a request per quiz question tap.
- **Caching onboarding status in component state after PATCH:** After each PATCH, increment `state.step` immediately (optimistic) rather than re-fetching status. Failure rolls back via error state.
- **Explicit back navigation in URL:** No Next.js `router.push('/onboarding/location')` — the entire flow is on `/`. Use Telegram BackButton only.
- **Using `prisma.user.update` with `connect`/`set` on explicit M2M:** The `UserDistrict` and `UserVibeTag` tables have explicit composite PKs and no implicit M2M relation — Prisma's `connect`/`set` shorthand does not work. Always `deleteMany + createMany`.
- **Writing scenario to User.scenario during /auth/telegram upsert for new users:** The CONCERNS.md flags this hardcode. Phase 1 fixes it: `PATCH /onboarding/scenario` writes the real value. The `upsertUser` in AuthService sets a default `looking_housing_roomie` only as initial placeholder — this is fine since onboarding overrides it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DTO validation | Manual if/else validators | `class-validator` decorators + global ValidationPipe | Already wired globally; `forbidNonWhitelisted: true` rejects unknown fields |
| Auth guard | Re-implement token check | `JwtAuthGuard` + `@CurrentUser()` from AuthModule | Already exported from `AuthModule` — just import |
| HTTP client on frontend | Custom fetch wrapper | `apiFetch` from `@/shared/lib/api` | Already exists in codebase with auth header injection |
| Step transition animations | Custom JS animations | CSS-only with `transition: transform` + class toggling | UI-SPEC mandates no Framer Motion or external animation library |
| M2M relation handling | Custom SQL | Prisma `$transaction([deleteMany, createMany])` | Type-safe, atomic, and already the pattern for Prisma explicit M2M |
| Scale aggregation formula | ML library | Simple weighted average in pure TS | 10 answers × 5 scales is trivial arithmetic — no library needed |

**Key insight:** This codebase is maximally self-sufficient. All infrastructure (auth, HTTP, validation, Prisma) exists. The task is wiring, not building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: QuizQuestion ID Mismatch Between Seed and Frontend Constant

**What goes wrong:** If the database assigns `QuizQuestion` IDs 1–10 via autoincrement but the seed runs after other inserts, or the sequence is not reset, IDs could be 8–17. The frontend `QUIZ_QUESTIONS` constant has `id: 1` through `id: 10`. `POST /onboarding/quiz` would fail FK constraints or insert answers against wrong questions.
**Why it happens:** Prisma autoincrement doesn't reset between dev restarts unless explicitly managed.
**How to avoid:** Seed quiz questions first on a fresh database with explicit IDs. Add a verification check in seed.ts: `if (await prisma.quizQuestion.count() !== 10) throw new Error('Seed mismatch')`.
**Warning signs:** FK violation on `UserQuizAnswer.questionId` during quiz submission.

### Pitfall 2: `$transaction` with Arrays and Conditional Items

**What goes wrong:** `prisma.$transaction([...ops])` where `ops` array is built dynamically (e.g., empty `districtIds` case) may include `undefined` items if not guarded.
**Why it happens:** `districtIds.map(...)` returns an empty array when there are no districts — that's fine. But conditional spread must be typed carefully.
**How to avoid:** Always filter undefined from transaction arrays. TypeScript strict mode will catch this if the types are right.
**Warning signs:** `TypeError: Cannot read properties of undefined` in Prisma transaction.

### Pitfall 3: Telegram BackButton `offClick` Cleanup

**What goes wrong:** If `BackButton.onClick(handler)` is registered but `offClick(handler)` is not called on cleanup, clicking back fires the handler multiple times (once per mount).
**Why it happens:** React `useEffect` runs on every dependency change. Each run registers a new handler. Without cleanup, old handlers accumulate.
**How to avoid:** Always pair `onClick` with `offClick` in the `useEffect` cleanup function. Use a stable handler reference with `useCallback`.
**Warning signs:** `step` decrements by 2+ on a single BackButton tap.

[VERIFIED: use-telegram-web-app.ts shows cleanup pattern with `return () => wa.BackButton.offClick(...)` expectation]

### Pitfall 4: `h-screen` vs `h-[100dvh]` in Telegram WebView

**What goes wrong:** Using `h-screen` makes the layout 100vh, which in Telegram WebView is calculated before the keyboard appears. Content gets clipped.
**Why it happens:** Telegram's WebView has a collapsing UI bar. `100dvh` accounts for this; `100vh` does not.
**How to avoid:** Always use `h-[100dvh]` for the root container. This is already enforced in `HomeView` and the UI-SPEC.
**Warning signs:** Bottom CTA button hidden under Telegram UI bar.

[VERIFIED: CONVENTIONS.md — "use h-[100dvh] (not h-screen)"; globals.css sets html/body to height: 100dvh]

### Pitfall 5: Missing CORS Before First API Call

**What goes wrong:** Phase 1 is the first phase where the frontend actually calls the backend. CORS is already enabled in `main.ts` (corrected since CONCERNS.md was written), but `NEXT_PUBLIC_API_URL` must be set in `front/.env.local`.
**Why it happens:** Without `NEXT_PUBLIC_API_URL`, `apiFetch` defaults to `http://localhost:3000` — correct for local dev, wrong for Telegram WebApp (which opens via Cloudflare tunnel).
**How to avoid:** Add `NEXT_PUBLIC_API_URL` to `front/.env.local` pointing to the tunnel backend URL. Document this in the walking skeleton task.
**Warning signs:** `ApiError: Failed to fetch` or CORS error in Telegram client.

[VERIFIED: shared/lib/api/config.ts — defaults to localhost:3000 without NEXT_PUBLIC_API_URL]

### Pitfall 6: Prisma Client Import Path in Seed/New Code

**What goes wrong:** Prisma 7 generates client to `generated/` directory, NOT `node_modules/@prisma/client`. Importing from `@prisma/client` may work with a compatibility shim but importing from the wrong path causes type errors.
**Why it happens:** Prisma 7 changed generated output location. `prisma.config.ts` confirms `generated/` directory exists.
**How to avoid:** Import from `'../generated/prisma'` in seed.ts and any backend code that needs the raw client (though `PrismaService` already wraps this).
**Warning signs:** `Module not found: '../generated/prisma'` or stale types.

[VERIFIED: CONCERNS.md mentions `generated/` directory; STACK.md "Prisma 7 — new generator" section]

### Pitfall 7: `onboardingStep` Increment Logic

**What goes wrong:** Blindly incrementing `onboardingStep` on every PATCH means that if the user re-submits an already-completed step (e.g., navigates back and re-confirms), `onboardingStep` goes beyond 6.
**Why it happens:** `{ increment: 1 }` in Prisma update always increments regardless of current value.
**How to avoid:** Use `Math.max(current, newStep)` pattern: in `OnboardingService`, only update `onboardingStep` if `dto`'s target step is higher than current. Or set absolute step number rather than incrementing:
```typescript
data: {
  onboardingStep: Math.max(user.onboardingStep, STEP_NUMBER + 1),
}
```
Requires fetching current step before update — adds a query, but prevents corruption.

[ASSUMED — based on standard onboarding pattern; verify with schema onboardingStep SmallInt constraint]

---

## Code Examples

### Walking Skeleton — Minimal End-to-End Slice

The thinnest slice proving the stack works: Telegram auth → save scenario → return status.

```typescript
// 1. Backend: OnboardingService.getStatus (simplest read)
async getStatus(userId: number) {
  const user = await this.prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      onboardingStep: true,
      onboardingCompleted: true,
      scenario: true,
      cityId: true,
      name: true,
    },
  });
  return user;
}

// 2. Backend: OnboardingService.saveScenario (simplest write)
async saveScenario(userId: number, dto: ScenarioDto) {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      scenario: dto.scenario,
      onboardingStep: 1,
    },
  });
  return { ok: true };
}
```

```typescript
// 3. Frontend: onboarding-api.ts (thin wrapper over apiFetch)
import { apiFetch } from '@/shared/lib/api';

export function getOnboardingStatus() {
  return apiFetch<OnboardingStatus>('/onboarding/status', { method: 'GET' });
}

export function saveScenario(scenario: ScenarioType) {
  return apiFetch<{ ok: boolean }>('/onboarding/scenario', {
    method: 'PATCH',
    body: { scenario },
  });
}
```

### UserPhoto Upsert Pattern

Phase 1 saves `telegramPhotoUrl` as display_order=0. The PATCH profile endpoint must upsert (not create new) if called again.

```typescript
// Source: schema.prisma UserPhoto — no unique on (userId, displayOrder), only PK id
// Must deleteMany + createMany to replace, not upsert
async saveProfile(userId: number, dto: ProfileDto) {
  const user = await this.prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { telegramPhotoUrl: true },
  });

  const photoUrls = dto.photoUrls.length > 0
    ? dto.photoUrls
    : user.telegramPhotoUrl
      ? [user.telegramPhotoUrl]
      : [];

  await this.prisma.$transaction([
    this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        onboardingStep: 6,
        onboardingCompleted: true,
        quizCompleted: true,
      },
    }),
    this.prisma.userVibeTag.deleteMany({ where: { userId } }),
    ...(dto.vibeTagIds.length > 0
      ? [this.prisma.userVibeTag.createMany({
          data: dto.vibeTagIds.map((tagId) => ({ userId, tagId })),
          skipDuplicates: true,
        })]
      : []),
    this.prisma.userPhoto.deleteMany({ where: { userId } }),
    ...(photoUrls.length > 0
      ? [this.prisma.userPhoto.createMany({
          data: photoUrls.map((url, i) => ({ userId, url, displayOrder: i })),
        })]
      : []),
  ]);
}
```

[VERIFIED: schema.prisma UserPhoto — no @@unique on (userId, displayOrder)]

### DTO Examples

```typescript
// Source: CONTEXT.md endpoint table + schema.prisma field types
// dto/scenario.dto.ts
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScenarioDto {
  @ApiProperty({ enum: ['looking_housing_roomie', 'has_housing_seeking_roomie', 'looking_roomie_find_housing', 'squad'] })
  @IsEnum(['looking_housing_roomie', 'has_housing_seeking_roomie', 'looking_roomie_find_housing', 'squad'])
  scenario!: 'looking_housing_roomie' | 'has_housing_seeking_roomie' | 'looking_roomie_find_housing' | 'squad';
}

// dto/location.dto.ts
import { IsInt, IsOptional, IsArray, Min } from 'class-validator';

export class LocationDto {
  @IsInt() @Min(1)
  cityId!: number;

  @IsArray() @IsInt({ each: true }) @IsOptional()
  districtIds?: number[];
}

// dto/quiz.dto.ts
import { IsArray, ValidateNested, IsInt, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class QuizAnswerDto {
  @IsInt() @Min(1) @Max(10)
  questionId!: number;

  @IsString()
  optionCode!: string;

  @IsNumber() @Min(0) @Max(1)
  answerValue!: number;
}

export class QuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
```

### GET /onboarding/status Response Shape

```typescript
// dto/status-response.dto.ts
export class OnboardingStatusDto {
  onboardingStep!: number;
  onboardingCompleted!: boolean;
  scenario!: string | null;
  cityId!: number | null;
  districtIds!: number[];
  budgetMin!: number | null;
  budgetMax!: number | null;
  moveInDate!: string | null;
  stayDurationMonths!: number | null;
  smokingOk!: boolean;
  petsOk!: boolean;
  guestsPref!: string;
  name!: string;
  telegramPhotoUrl!: string | null;
  vibeTagIds!: number[];
  quizCompleted!: boolean;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` | `@theme inline` in CSS | Tailwind v4 | No JS config file in project — do not add one |
| `@prisma/client` import | `../generated/prisma` import | Prisma v7 | Import path changed in this project |
| `images.domains` in next.config | `images.remotePatterns` | Next.js 15+ | Already correct in next.config.ts |
| `h-screen` | `h-[100dvh]` | Ongoing Telegram WebView requirement | Always use dvh |
| Multi-route navigation for forms | State machine on single route | Project decision | Telegram BackButton API replaces URL navigation |

**Deprecated/outdated in this project:**
- `tailwind.config.js`: Tailwind 4 CSS-first, do not create.
- `AppController.getHello()`: Scaffold placeholder, will conflict with real health route — Phase 1 should replace with a proper `GET /health` endpoint.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma 7 `create` with explicit `id` works when autoincrement sequence is reset via `$executeRaw` | Pattern 6: Seed | Quiz question IDs would not match frontend constants; PATCH /onboarding/quiz would fail FK |
| A2 | `onboardingStep` should be set to absolute value (not incremented) to handle re-submission safely | Pitfall 7 | If increment is used, re-submitting a step corrupts onboardingStep beyond valid range |
| A3 | `Telegram.WebApp.BackButton.offClick(handler)` accepts the same function reference registered with `onClick` for cleanup | Pattern 5: BackButton | If offClick works differently, back navigation fires multiple times per tap |

---

## Open Questions

1. **Walking skeleton: Should Phase 1 run `prisma migrate dev --name init` as its first task?**
   - What we know: No migrations exist (`prisma/migrations/` directory absent per CONCERNS.md). The database has no tables.
   - What's unclear: Has the developer already run an initial migration manually? The CONCERNS.md says "migrations have never been run" (as of 2026-05-22).
   - Recommendation: Plan a Wave 0 "infrastructure" task that runs `prisma migrate dev --name init` and documents the DATABASE_URL setup. This is a one-time manual step, but the plan must include it.

2. **ScenarioType enum: import from Prisma-generated client or redeclare in DTO?**
   - What we know: `ScenarioType` is a Prisma enum defined in `schema.prisma`. Generated to `../generated/prisma`.
   - What's unclear: Whether importing Prisma-generated enums into DTOs is the established pattern (only `AuthService` uses Prisma types, not DTOs).
   - Recommendation: Redeclare as string literal union in the DTO (`IsEnum(['looking_housing_roomie', ...])`) to keep DTO layer independent of Prisma generated types. Use `as ScenarioType` cast when passing to Prisma.

3. **`GET /onboarding/status`: should it return `districtIds` as a flat array or nested objects?**
   - What we know: `UserDistrict` table has `userId + districtId`. Frontend LocationStep needs to pre-select chips.
   - What's unclear: Whether frontend needs the district names too (for rendering), or just IDs (for comparison with loaded chips).
   - Recommendation: Return `districtIds: number[]` (flat). The frontend already loads all districts via `GET /geo/cities/:cityId/districts` and can cross-reference by ID.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend runtime | ✓ | v22.12.0 | — |
| npm | Package management | ✓ | 11.2.0 | — |
| PostgreSQL | Prisma data layer | ? | Unknown | Must set up before any dev |
| `ts-node` | Prisma seed script | ✓ | ^10.9.2 (devDep) | — |
| `tsconfig-paths` | ts-node path resolution | ✓ | ^4.2.0 (devDep) | — |
| Telegram Bot (TELEGRAM_BOT_TOKEN) | initData HMAC verification | ? | — | Cannot test auth without it |
| Cloudflare tunnel | HTTPS for Telegram WebApp | ? | Assumed installed per STACK.md | Use localtunnel as fallback |

[VERIFIED: Node/npm via Bash; ts-node/tsconfig-paths via package.json inspection]

**Missing dependencies with no fallback:**
- PostgreSQL: Required for any backend development. Must be set up manually. Plan must include setup instructions or refer to existing `.env`.
- TELEGRAM_BOT_TOKEN: Required for auth. Must be configured before walking skeleton can be tested in Telegram.

**Missing dependencies with fallback:**
- Cloudflare tunnel: Can use `localtunnel` or test locally with `initData` mocked.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.x + ts-jest 29.x (backend) |
| Config file | Inline in `roomies back/package.json` under `"jest"` key |
| Quick run command | `cd "roomies back" && npm test -- --testPathPattern=onboarding` |
| Full suite command | `cd "roomies back" && npm test` |
| Frontend test framework | None — not established |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBOARD-01 | `saveScenario` writes correct scenario to User | unit | `npm test -- --testPathPattern=onboarding.service` | ❌ Wave 0 |
| ONBOARD-02 | `saveLocation` replaces UserDistricts atomically | unit | `npm test -- --testPathPattern=onboarding.service` | ❌ Wave 0 |
| ONBOARD-03 | `saveBudget` writes nullable date fields correctly | unit | `npm test -- --testPathPattern=onboarding.service` | ❌ Wave 0 |
| ONBOARD-04 | `saveDealbreakers` writes smokingOk/petsOk/guestsPref | unit | `npm test -- --testPathPattern=onboarding.service` | ❌ Wave 0 |
| ONBOARD-05 | `saveQuiz` computes all 5 scales correctly (average) | unit | `npm test -- --testPathPattern=onboarding.service` | ❌ Wave 0 |
| ONBOARD-06 | `saveProfile` replaces UserVibeTags + UserPhotos atomically | unit | `npm test -- --testPathPattern=onboarding.service` | ❌ Wave 0 |
| ONBOARD-07 | `onboardingCompleted=true` set after saveProfile | unit | `npm test -- --testPathPattern=onboarding.service` | ❌ Wave 0 |
| ONBOARD-05 | `computeScales` returns correct averages for 2-question scales | unit | `npm test -- --testPathPattern=compute-scales` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd "roomies back" && npm test -- --testPathPattern=onboarding.service --passWithNoTests`
- **Per wave merge:** `cd "roomies back" && npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `roomies back/src/onboarding/onboarding.service.spec.ts` — covers ONBOARD-01 through ONBOARD-07
- [ ] `roomies back/src/onboarding/compute-scales.spec.ts` — covers ONBOARD-05 scale aggregation (pure function, no DB mock needed)
- [ ] Mock pattern: `{ provide: PrismaService, useValue: mockPrisma }` pattern needs to be established (no existing template in codebase)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JwtAuthGuard already implemented — use on all onboarding routes |
| V3 Session Management | no | Stateless JWT, no server-side sessions |
| V4 Access Control | yes | `@CurrentUser()` decorator ensures user can only write their own data |
| V5 Input Validation | yes | `class-validator` + global ValidationPipe with `whitelist: true` |
| V6 Cryptography | no (Phase 1) | No new crypto operations in onboarding |

### Known Threat Patterns for NestJS + Prisma

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| User writes to another user's onboarding data | Tampering | `@CurrentUser()` extracts userId from JWT — only write `where: { id: user.id }` |
| Mass assignment via PATCH body | Tampering | `forbidNonWhitelisted: true` in global ValidationPipe already active |
| Quiz answer injection (answerValue outside 0–1) | Tampering | `@IsNumber() @Min(0) @Max(1)` on QuizAnswerDto.answerValue |
| District/tag IDs referencing non-existent records | Tampering | Prisma FK constraint throws on invalid IDs — let it bubble as 400/500 |
| Re-submitting completed onboarding to change scenario | Tampering | `onboardingCompleted` flag is set; service should check and allow re-submission (it's a user updating their own data) or block if needed — accept for Phase 1 |

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection: `roomies back/prisma/schema.prisma` — all table structures verified
- Codebase inspection: `roomies back/src/auth/auth.service.ts`, `auth.module.ts`, `auth.controller.ts` — NestJS module pattern confirmed
- Codebase inspection: `front/shared/lib/api/client.ts`, `auth.ts`, `index.ts` — apiFetch pattern confirmed
- Codebase inspection: `front/features/auth/model/use-telegram-auth.ts` — auth hook pattern confirmed
- Codebase inspection: `.planning/phases/1/01-UI-SPEC.md` — all screen specs, component inventory, motion rules confirmed
- Codebase inspection: `.planning/phases/1-CONTEXT.md` — all 8 locked decisions confirmed
- Codebase inspection: `.planning/codebase/CONVENTIONS.md` — FSD layer rules, NestJS module pattern confirmed
- Codebase inspection: `.planning/codebase/STACK.md` — dependency versions confirmed
- Codebase inspection: `front/app/globals.css` — design tokens confirmed

### Secondary (MEDIUM confidence)

- `.planning/codebase/CONCERNS.md` — identifies CORS fix, migrations gap, seed requirement (authored 2026-05-22, verified still relevant by checking main.ts which now has CORS enabled)
- `.planning/codebase/TESTING.md` — Jest config, mock patterns

### Tertiary (LOW confidence)

- Prisma explicit-ID-on-autoincrement behavior via `$executeRaw` sequence reset — [ASSUMED] based on standard Postgres behavior; verify with `prisma studio` after seed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json
- Architecture: HIGH — pattern mirrors existing AuthModule exactly
- Prisma patterns: HIGH (M2M replace), MEDIUM (explicit ID seed)
- Frontend state machine: HIGH — based on existing React patterns in codebase
- Pitfalls: HIGH — all verified against actual code
- Seed strategy: MEDIUM — `ts-node` confirmed available, ID-sequence reset is ASSUMED

**Research date:** 2026-06-07
**Valid until:** 2026-07-07 (stable stack, 30-day validity)
