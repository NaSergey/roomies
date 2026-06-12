# Phase 1: Onboarding — Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 27 (new/modified)
**Analogs found:** 27 / 27

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `roomies back/src/onboarding/onboarding.module.ts` | module | — | `roomies back/src/auth/auth.module.ts` | exact |
| `roomies back/src/onboarding/onboarding.controller.ts` | controller | request-response | `roomies back/src/auth/auth.controller.ts` | exact |
| `roomies back/src/onboarding/onboarding.service.ts` | service | CRUD | `roomies back/src/auth/auth.service.ts` | role-match |
| `roomies back/src/onboarding/dto/scenario.dto.ts` | DTO | — | `roomies back/src/auth/dto/telegram-login.dto.ts` | exact |
| `roomies back/src/onboarding/dto/location.dto.ts` | DTO | — | `roomies back/src/auth/dto/telegram-login.dto.ts` | role-match |
| `roomies back/src/onboarding/dto/budget.dto.ts` | DTO | — | `roomies back/src/auth/dto/telegram-login.dto.ts` | role-match |
| `roomies back/src/onboarding/dto/dealbreakers.dto.ts` | DTO | — | `roomies back/src/auth/dto/telegram-login.dto.ts` | role-match |
| `roomies back/src/onboarding/dto/quiz.dto.ts` | DTO | — | `roomies back/src/auth/dto/telegram-login.dto.ts` | role-match |
| `roomies back/src/onboarding/dto/profile.dto.ts` | DTO | — | `roomies back/src/auth/dto/telegram-login.dto.ts` | role-match |
| `roomies back/src/onboarding/dto/status-response.dto.ts` | DTO | — | `roomies back/src/auth/dto/telegram-login.dto.ts` | role-match |
| `roomies back/src/geo/geo.module.ts` | module | — | `roomies back/src/auth/auth.module.ts` | role-match |
| `roomies back/src/geo/geo.controller.ts` | controller | request-response | `roomies back/src/auth/auth.controller.ts` | role-match |
| `roomies back/src/geo/geo.service.ts` | service | CRUD | `roomies back/src/auth/auth.service.ts` | role-match |
| `roomies back/src/vibe-tags/vibe-tags.module.ts` | module | — | `roomies back/src/auth/auth.module.ts` | role-match |
| `roomies back/src/vibe-tags/vibe-tags.controller.ts` | controller | request-response | `roomies back/src/auth/auth.controller.ts` | role-match |
| `roomies back/src/vibe-tags/vibe-tags.service.ts` | service | CRUD | `roomies back/src/auth/auth.service.ts` | role-match |
| `roomies back/prisma/seed.ts` | utility | batch | RESEARCH.md Pattern 6 (no codebase analog) | no analog |
| `front/features/onboarding/ui/OnboardingFlow.tsx` | component | request-response | `front/widgets/home/ui/HomeView.tsx` | role-match |
| `front/features/onboarding/ui/steps/ScenarioStep.tsx` | component | request-response | `front/features/auth/ui/AuthStatusChip.tsx` | partial |
| `front/features/onboarding/ui/steps/LocationStep.tsx` | component | request-response | `front/features/auth/ui/AuthStatusChip.tsx` | partial |
| `front/features/onboarding/ui/steps/BudgetStep.tsx` | component | request-response | `front/features/auth/ui/AuthStatusChip.tsx` | partial |
| `front/features/onboarding/ui/steps/DealbreakersStep.tsx` | component | request-response | `front/features/auth/ui/AuthStatusChip.tsx` | partial |
| `front/features/onboarding/ui/steps/QuizStep.tsx` | component | request-response | `front/features/swipe-profile/ui/SwipeCard.tsx` | partial |
| `front/features/onboarding/ui/steps/ProfileStep.tsx` | component | request-response | `front/features/auth/ui/AuthStatusChip.tsx` | partial |
| `front/features/onboarding/ui/steps/DoneStep.tsx` | component | — | `front/features/auth/ui/AuthStatusChip.tsx` | partial |
| `front/features/onboarding/model/use-onboarding.ts` | hook | request-response | `front/features/auth/model/use-telegram-auth.ts` | role-match |
| `front/features/onboarding/model/types.ts` | types | — | `front/features/swipe-profile/model/types.ts` | exact |
| `front/features/onboarding/model/quiz-questions.ts` | constants | — | no analog | no analog |
| `front/features/onboarding/api/onboarding-api.ts` | API client | request-response | `front/shared/lib/api/auth.ts` | exact |
| `front/features/onboarding/index.ts` | barrel | — | `front/features/auth/index.ts` | exact |
| `front/shared/lib/api/geo.ts` | API client | request-response | `front/shared/lib/api/auth.ts` | exact |
| `front/shared/lib/api/vibe-tags.ts` | API client | request-response | `front/shared/lib/api/auth.ts` | exact |
| `front/widgets/home/ui/HomeView.tsx` | component (modify) | request-response | itself | self |

---

## Pattern Assignments

### `roomies back/src/onboarding/onboarding.module.ts` (module)

**Analog:** `roomies back/src/auth/auth.module.ts`

**Full file pattern** (lines 1-22):
```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [AuthModule],     // import to get JwtAuthGuard + JwtModule
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
```

**Note:** PrismaModule is `@Global()` (see `roomies back/src/prisma/prisma.module.ts` line 1) — `PrismaService` is available everywhere without explicit import. AuthModule must be imported to re-use `JwtAuthGuard`.

---

### `roomies back/src/onboarding/onboarding.controller.ts` (controller, request-response)

**Analog:** `roomies back/src/auth/auth.controller.ts`

**Imports pattern** (lines 1-7):
```typescript
import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { ScenarioDto } from './dto/scenario.dto';
// ... other DTO imports
```

**Controller class + GET route pattern** (lines 8-27 of auth.controller.ts adapted):
```typescript
@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статус онбординга текущего пользователя' })
  getStatus(@CurrentUser() user: { id: number }) {
    return this.onboarding.getStatus(user.id);
  }

  @Patch('scenario')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Шаг 0: сохранить сценарий' })
  patchScenario(
    @CurrentUser() user: { id: number },
    @Body() dto: ScenarioDto,
  ) {
    return this.onboarding.saveScenario(user.id, dto);
  }
  // ... repeat pattern for patchLocation, patchBudget, patchDealbreakers, postQuiz, patchProfile
}
```

**Key pattern from auth.controller.ts line 26:** `@CurrentUser() user: { id: number; telegramId: bigint }` — for onboarding controller only `id` is needed. Use `@CurrentUser() user: { id: number }`.

---

### `roomies back/src/onboarding/onboarding.service.ts` (service, CRUD)

**Analog:** `roomies back/src/auth/auth.service.ts`

**Imports + constructor pattern** (lines 1-14 of auth.service.ts):
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScenarioDto } from './dto/scenario.dto';
// ... other DTO imports

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}
  // No JwtService or ConfigService needed — pure CRUD
}
```

**Simple update pattern** (adapted from auth.service.ts lines 72-82):
```typescript
async saveScenario(userId: number, dto: ScenarioDto) {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      scenario: dto.scenario as ScenarioType,
      onboardingStep: 1,
    },
  });
  return { ok: true };
}
```

**M2M replace pattern for saveLocation** (RESEARCH.md Pattern 2 — no direct codebase analog, use this exact shape):
```typescript
async saveLocation(userId: number, dto: LocationDto) {
  const districtIds = dto.districtIds ?? [];
  await this.prisma.$transaction([
    this.prisma.user.update({
      where: { id: userId },
      data: { cityId: dto.cityId, onboardingStep: 2 },
    }),
    this.prisma.userDistrict.deleteMany({ where: { userId } }),
    ...(districtIds.length > 0
      ? [this.prisma.userDistrict.createMany({
          data: districtIds.map((districtId) => ({ userId, districtId })),
          skipDuplicates: true,
        })]
      : []),
  ]);
  return { ok: true };
}
```

**getStatus pattern** (RESEARCH.md Code Examples):
```typescript
async getStatus(userId: number) {
  const user = await this.prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      onboardingStep: true,
      onboardingCompleted: true,
      quizCompleted: true,
      scenario: true,
      cityId: true,
      budgetMin: true,
      budgetMax: true,
      moveInDate: true,
      stayDurationMonths: true,
      smokingOk: true,
      petsOk: true,
      guestsPref: true,
      name: true,
      telegramPhotoUrl: true,
      districts: { select: { districtId: true } },
      vibeTags:  { select: { tagId: true } },
    },
  });
  return {
    ...user,
    districtIds: user.districts.map((d) => d.districtId),
    vibeTagIds:  user.vibeTags.map((t) => t.tagId),
  };
}
```

---

### `roomies back/src/onboarding/dto/*.dto.ts` (DTOs)

**Analog:** `roomies back/src/auth/dto/telegram-login.dto.ts`

**DTO file structure pattern** (lines 1-12):
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsArray, Min, Max, IsBoolean, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ScenarioDto {
  @ApiProperty({ enum: ['looking_housing_roomie', 'has_housing_seeking_roomie', 'looking_roomie_find_housing', 'squad'] })
  @IsEnum(['looking_housing_roomie', 'has_housing_seeking_roomie', 'looking_roomie_find_housing', 'squad'])
  scenario!: string;
}
```

**Note from analog (telegram-login.dto.ts line 10):** Use `!` (definite assignment assertion) on all DTO fields. `@ApiProperty` goes before validator decorators. Import only validators actually used — `forbidNonWhitelisted: true` is globally active so never add extra fields.

**Nested DTO pattern for QuizDto** (RESEARCH.md Code Examples):
```typescript
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

---

### `roomies back/src/geo/geo.module.ts` + `geo.controller.ts` + `geo.service.ts`

**Analog:** `roomies back/src/auth/auth.module.ts` + `auth.controller.ts` + `auth.service.ts`

**Module pattern** — minimal, no JwtModule needed (geo endpoints are public):
```typescript
import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';

@Module({
  controllers: [GeoController],
  providers: [GeoService],
})
export class GeoModule {}
```

**Controller pattern** — no `@UseGuards`, no `@ApiBearerAuth()` (public endpoints):
```typescript
@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('cities')
  @ApiOperation({ summary: 'Список городов' })
  getCities() {
    return this.geo.getCities();
  }

  @Get('cities/:cityId/districts')
  @ApiOperation({ summary: 'Районы города' })
  getDistricts(@Param('cityId', ParseIntPipe) cityId: number) {
    return this.geo.getDistricts(cityId);
  }
}
```

**Service pattern** (simple Prisma reads, no auth needed):
```typescript
@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  getCities() {
    return this.prisma.city.findMany({ orderBy: { name: 'asc' } });
  }

  getDistricts(cityId: number) {
    return this.prisma.district.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    });
  }
}
```

---

### `roomies back/src/vibe-tags/vibe-tags.module.ts` + controller + service

**Analog:** Same minimal module pattern as geo above.

**Pattern** — single `GET /vibe-tags`, public endpoint, no guard:
```typescript
// vibe-tags.module.ts — identical structure to geo.module.ts
// vibe-tags.controller.ts:
@Get()
getAll() { return this.vibeTags.findAll(); }

// vibe-tags.service.ts:
findAll() {
  return this.prisma.vibeTag.findMany({ orderBy: { label: 'asc' } });
}
```

---

### `roomies back/prisma/seed.ts` (batch utility)

**No codebase analog.** Use RESEARCH.md Pattern 6.

**Import path** — CRITICAL (see Pitfall 6 in RESEARCH.md): Prisma 7 generates to `generated/prisma`, NOT `@prisma/client`. However `prisma.service.ts` (line 3) imports from `@prisma/client` directly — check `prisma.config.ts` for actual output path.

**Actual import used in `prisma.service.ts` lines 2-3:**
```typescript
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
```

Use the same import in seed.ts:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Reset sequences for deterministic IDs
  await prisma.$executeRaw`ALTER SEQUENCE quiz_questions_id_seq RESTART WITH 1`;

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
  // ... districts, quiz questions (explicit id 1–10), vibe tags
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

---

### `front/features/onboarding/api/onboarding-api.ts` (API client, request-response)

**Analog:** `front/shared/lib/api/auth.ts`

**Full file pattern** (auth.ts lines 1-30):
```typescript
'use client';

import { apiFetch } from '@/shared/lib/api';
import type { OnboardingStatus, ScenarioType, LocationPayload, BudgetPayload, DealbreakersPayload, QuizPayload, ProfilePayload } from '../model/types';

export function getOnboardingStatus() {
  return apiFetch<OnboardingStatus>('/onboarding/status', { method: 'GET' });
}

export function saveScenario(scenario: ScenarioType) {
  return apiFetch<{ ok: boolean }>('/onboarding/scenario', {
    method: 'PATCH',
    body: { scenario },
  });
}

export function saveLocation(payload: LocationPayload) {
  return apiFetch<{ ok: boolean }>('/onboarding/location', {
    method: 'PATCH',
    body: payload,
  });
}
// ... saveBudget, saveDealbreakers, saveQuiz (POST), saveProfile (PATCH)
```

**Key patterns from auth.ts:**
- Line 1: `'use client';` directive always first.
- Line 3: Import `apiFetch` from `@/shared/lib/api` (barrel — never from `./client` directly).
- `auth: false` only for unauthenticated calls (like `loginWithTelegram`). All onboarding calls use `auth: true` (default).
- `body: { ... }` not `JSON.stringify(...)` — `apiFetch` handles serialisation (client.ts lines 27-28).

---

### `front/shared/lib/api/geo.ts` + `vibe-tags.ts` (API clients)

**Analog:** `front/shared/lib/api/auth.ts`

**Pattern** (minimal read-only wrappers):
```typescript
'use client';

import { apiFetch } from './client';

export type City = { id: number; name: string; countryCode: string };
export type District = { id: number; cityId: number; name: string };

export function getCities(): Promise<City[]> {
  return apiFetch<City[]>('/geo/cities', { method: 'GET' });
}

export function getDistricts(cityId: number): Promise<District[]> {
  return apiFetch<District[]>(`/geo/cities/${cityId}/districts`, { method: 'GET' });
}
```

**Note:** `geo.ts` and `vibe-tags.ts` live in `front/shared/lib/api/` so they import from `'./client'` not `'@/shared/lib/api'` (would be circular). They are re-exported from `front/shared/lib/api/index.ts`.

---

### `front/features/onboarding/model/types.ts` (types)

**Analog:** `front/features/swipe-profile/model/types.ts`

**Pattern** (types.ts lines 1-2 — pure TS type exports, no runtime code):
```typescript
// types.ts — type-only file, no 'use client' needed, no runtime imports

export type ScenarioType =
  | 'looking_housing_roomie'
  | 'has_housing_seeking_roomie'
  | 'looking_roomie_find_housing'
  | 'squad';

export type GuestsPreference = 'rarely' | 'sometimes' | 'often';

export type QuizAnswer = {
  questionId: number;
  optionCode: string;
  answerValue: number;
};

export type OnboardingAnswers = {
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

export type OnboardingState = {
  step: number;
  loading: boolean;
  error: string | null;
  answers: OnboardingAnswers;
};

export type OnboardingAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'UPDATE_ANSWERS'; answers: Partial<OnboardingAnswers> }
  | { type: 'COMPLETE' };

export type OnboardingStatus = {
  onboardingStep: number;
  onboardingCompleted: boolean;
  quizCompleted: boolean;
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
  name: string;
  telegramPhotoUrl: string | null;
  vibeTagIds: number[];
};

// Payload types for API calls
export type LocationPayload = { cityId: number; districtIds?: number[] };
export type BudgetPayload = { budgetMin: number; budgetMax: number; moveInDate?: string; stayDurationMonths?: number };
export type DealbreakersPayload = { smokingOk: boolean; petsOk: boolean; guestsPref: GuestsPreference };
export type QuizPayload = { answers: QuizAnswer[] };
export type ProfilePayload = { name: string; photoUrls: string[]; vibeTagIds: number[] };
```

---

### `front/features/onboarding/model/use-onboarding.ts` (hook, request-response)

**Analog:** `front/features/auth/model/use-telegram-auth.ts`

**Header pattern** (use-telegram-auth.ts lines 1-3):
```typescript
'use client';

import { useEffect, useReducer, useCallback } from 'react';
import { getWebApp } from '@/shared/lib/telegram';
import { getOnboardingStatus, saveScenario, saveLocation, saveBudget, saveDealbreakers, saveQuiz, saveProfile } from '../api/onboarding-api';
import type { OnboardingState, OnboardingAction, OnboardingAnswers } from './types';
```

**Reducer pattern** (pure function, outside hook — mirrors use-telegram-auth.ts useState approach but with useReducer for complex state):
```typescript
const initialAnswers: OnboardingAnswers = {
  scenario: null, cityId: null, districtIds: [],
  budgetMin: null, budgetMax: null, moveInDate: null, stayDurationMonths: null,
  smokingOk: false, petsOk: false, guestsPref: 'sometimes',
  quizAnswers: [], name: '', photoUrls: [], vibeTagIds: [],
};

const initialState: OnboardingState = {
  step: 0, loading: false, error: null, answers: initialAnswers,
};

function reducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':    return { ...state, step: action.step };
    case 'SET_LOADING': return { ...state, loading: action.loading };
    case 'SET_ERROR':   return { ...state, error: action.error };
    case 'UPDATE_ANSWERS': return { ...state, answers: { ...state.answers, ...action.answers } };
    case 'COMPLETE':    return { ...state, step: 6 };
    default:            return state;
  }
}
```

**Hook body pattern** (mirrors use-telegram-auth.ts lines 32-76):
```typescript
export function useOnboarding() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // On mount: fetch status for resume (mirrors useEffect(() => { ... }, []) in use-telegram-auth.ts line 32)
  useEffect(() => {
    let cancelled = false;
    getOnboardingStatus()
      .then((status) => {
        if (cancelled) return;
        if (status.onboardingStep > 0) {
          dispatch({ type: 'SET_STEP', step: status.onboardingStep });
          dispatch({ type: 'UPDATE_ANSWERS', answers: {
            scenario: status.scenario,
            cityId: status.cityId,
            districtIds: status.districtIds,
            // ... hydrate all saved fields
          }});
        }
      })
      .catch(() => { /* ignore resume errors — start fresh */ });
    return () => { cancelled = true; };
  }, []);

  // BackButton side effect (RESEARCH.md Pattern 5, Pitfall 3 cleanup)
  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_STEP', step: state.step - 1 });
  }, [state.step]);

  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;
    if (state.step > 0 && state.step < 6) {
      wa.BackButton.show();
      wa.BackButton.onClick(handleBack);
    } else {
      wa.BackButton.hide();
    }
    return () => {
      wa.BackButton.offClick(handleBack);
    };
  }, [state.step, handleBack]);

  // Per-step submit handler (mirrors .then/.catch pattern from use-telegram-auth.ts lines 56-71)
  const submitScenario = useCallback(async (scenario: ScenarioType) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      await saveScenario(scenario);
      dispatch({ type: 'UPDATE_ANSWERS', answers: { scenario } });
      dispatch({ type: 'SET_STEP', step: 1 });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : 'Ошибка' });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  return { state, submitScenario, /* ...other submit handlers */ };
}
```

---

### `front/features/onboarding/ui/OnboardingFlow.tsx` (component, request-response)

**Analog:** `front/widgets/home/ui/HomeView.tsx`

**Header + conditional render pattern** (HomeView.tsx lines 1-39):
```typescript
'use client';

import { useOnboarding } from '../model/use-onboarding';
import { ScenarioStep } from './steps/ScenarioStep';
import { LocationStep } from './steps/LocationStep';
// ... other step imports

const STEPS = [ScenarioStep, LocationStep, BudgetStep, DealbreakersStep, QuizStep, ProfileStep, DoneStep];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { state, submitScenario, submitLocation, /* ... */ } = useOnboarding();
  const StepComponent = STEPS[state.step];

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col">
      {state.error && (
        <div className="rounded-2xl bg-rose-100 px-3 py-2 text-xs text-rose-700">
          {state.error}
        </div>
      )}
      <StepComponent state={state} onSubmit={...} />
    </main>
  );
}
```

**Note from HomeView.tsx line 15:** Use `h-dvh` (not `h-screen`). The `main` className matches existing HomeView exactly.

---

### Step components — `ScenarioStep.tsx`, `LocationStep.tsx`, etc. (components)

**Analog:** `front/features/auth/ui/AuthStatusChip.tsx`

**Component file pattern** (AuthStatusChip.tsx lines 1-75):
```typescript
'use client';

import type { OnboardingState } from '../../model/types';

interface ScenarioStepProps {
  state: OnboardingState;
  onSubmit: (scenario: ScenarioType) => void;
}

export function ScenarioStep({ state, onSubmit }: ScenarioStepProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      {/* header, title, options */}
    </div>
  );
}
```

**Tailwind patterns from existing components:**
- `front/widgets/home/ui/HomeView.tsx` line 56: `className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-(--text) transition-transform active:scale-95"` — button tap feedback.
- `front/features/auth/ui/AuthStatusChip.tsx` line 68: `className="... rounded-full bg-surface px-2.5 py-1 ..."` — surface token.
- CSS tokens from `globals.css`: `bg-surface`, `text-(--text)`, `var(--shadow-button)`.
- No Framer Motion, no external animation library (UI-SPEC constraint).

---

### `front/features/onboarding/ui/steps/QuizStep.tsx` (component)

**Analog:** `front/features/swipe-profile/ui/SwipeCard.tsx`

**Pattern for A/B tap-only quiz** — simpler than SwipeCard (no drag, no pointer events):
```typescript
'use client';

import type { OnboardingState, QuizAnswer } from '../../model/types';
import { QUIZ_QUESTIONS } from '../../model/quiz-questions';

interface QuizStepProps {
  state: OnboardingState;
  onSubmit: (answers: QuizAnswer[]) => void;
}

export function QuizStep({ state, onSubmit }: QuizStepProps) {
  // Local state: which question index (0-9) and accumulated answers
  // Submit calls onSubmit(allAnswers) only after question 10
  // Progress bar: (currentQuestion + 1) / QUIZ_QUESTIONS.length
}
```

**Key difference from SwipeCard:** No `useRef`, no `usePointerCapture`, no drag. Just `useState` for current question index + tap on A/B button → advance.

---

### `front/features/onboarding/model/quiz-questions.ts` (constants)

**No codebase analog.** Use CONTEXT.md Decision 3 verbatim.

**Pattern** — typed constant, no `'use client'` needed (pure data):
```typescript
export type QuizQuestion = {
  id: number;
  text: string;
  optionA: { code: string; label: string; value: number };
  optionB: { code: string; label: string; value: number };
  scale: 'noiseLevel' | 'cleanliness' | 'sleepSchedule' | 'socialLevel' | 'workFromHome';
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 1, text: 'Тишина дома — это важно?', optionA: { code: 'silence', label: '🔇 Обязательно', value: 1.0 }, optionB: { code: 'noise', label: '🎵 Шум окей', value: 0.0 }, scale: 'noiseLevel' },
  // ... 10 questions total
] as const;
```

---

### `front/features/onboarding/index.ts` (barrel)

**Analog:** `front/features/auth/index.ts`

**Pattern** (auth/index.ts lines 1-2 — named exports only, no default exports):
```typescript
export { OnboardingFlow } from './ui/OnboardingFlow';
export { useOnboarding } from './model/use-onboarding';
export type { OnboardingState, OnboardingAnswers } from './model/types';
```

---

### `front/widgets/home/ui/HomeView.tsx` (MODIFY — add onboarding gate)

**Self-analog** — existing file at `front/widgets/home/ui/HomeView.tsx`.

**Current file** (full, lines 1-81):
- Line 4: `import { MOCK_PROFILES } from '@/entities/profile';`
- Line 5: `import { AuthStatusChip, useTelegramAuth } from '@/features/auth';`
- Line 37: `<SwipeDeck profiles={MOCK_PROFILES} />`

**Modifications required:**
1. Add `useState` for `onboardingCompleted`.
2. Import `OnboardingFlow` from `@/features/onboarding`.
3. After `useTelegramAuth()`, call `useOnboardingGate()` or inline logic using `getOnboardingStatus`.
4. Replace `<SwipeDeck profiles={MOCK_PROFILES} />` with conditional:
```typescript
{onboardingCompleted
  ? <SwipeDeck profiles={MOCK_PROFILES} />
  : <OnboardingFlow onComplete={() => setOnboardingCompleted(true)} />
}
```
5. Keep all existing imports/structure. Add only what is needed.

**Exact lines to change:**
- Add after line 3: `import { useState } from 'react';`
- Add after line 5: `import { OnboardingFlow } from '@/features/onboarding';`
- Add after `const auth = useTelegramAuth();` (line 12): `const [onboardingCompleted, setOnboardingCompleted] = useState(false);`
  - Note: Phase 1 initialises to `false` unconditionally. The `useOnboarding` hook will fetch status on mount and transition automatically if the user has already completed onboarding.
- Replace line 37 with the conditional render above.

---

## Shared Patterns

### Authentication Guard
**Source:** `roomies back/src/auth/jwt-auth.guard.ts` + `roomies back/src/auth/current-user.decorator.ts`
**Apply to:** All onboarding controller route handlers (all 8 routes)
```typescript
// Every protected route: these two decorators go together
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
// Then extract user ID in the handler:
@CurrentUser() user: { id: number }
// NEVER use user.telegramId in onboarding — only user.id needed
```

### PrismaService Injection
**Source:** `roomies back/src/prisma/prisma.service.ts` + `roomies back/src/prisma/prisma.module.ts`
**Apply to:** All new services (OnboardingService, GeoService, VibeTagsService)
```typescript
// PrismaModule is @Global() — no need to import it in each module
// In each service constructor:
constructor(private readonly prisma: PrismaService) {}
// Import type only (PrismaService auto-provided):
import { PrismaService } from '../prisma/prisma.service';
```

### AppModule Registration
**Source:** `roomies back/src/app.module.ts` lines 1-17
**Apply to:** All three new modules must be added to AppModule.imports
```typescript
// Add to app.module.ts imports array:
import { OnboardingModule } from './onboarding/onboarding.module';
import { GeoModule } from './geo/geo.module';
import { VibeTagsModule } from './vibe-tags/vibe-tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OnboardingModule,   // ADD
    GeoModule,          // ADD
    VibeTagsModule,     // ADD
  ],
  // ...
})
```

### Frontend API Barrel Export
**Source:** `front/shared/lib/api/index.ts`
**Apply to:** After creating `geo.ts` and `vibe-tags.ts`, add exports to this file
```typescript
// ADD to front/shared/lib/api/index.ts:
export { getCities, getDistricts, type City, type District } from './geo';
export { getVibeTags, type VibeTag } from './vibe-tags';
```

### 'use client' Directive
**Source:** All frontend files — `use-telegram-auth.ts` line 1, `auth.ts` line 1, `client.ts` line 1, `HomeView.tsx` line 1, `SwipeCard.tsx` line 1
**Apply to:** ALL `.tsx` files and all `use-*.ts` hook files and all `*-api.ts` files
```typescript
// Always first line, before any imports:
'use client';
```
**Exception:** `types.ts` and `quiz-questions.ts` are pure data/type files — no `'use client'` needed.

### Error Handling in Frontend Hooks
**Source:** `front/features/auth/model/use-telegram-auth.ts` lines 62-70
```typescript
// Standard error extraction pattern used throughout:
.catch((e: unknown) => {
  if (cancelled) return;
  const message =
    e instanceof ApiError
      ? `${e.status}: ${e.message}`
      : e instanceof Error
        ? e.message
        : 'Не удалось выполнить запрос';
  // dispatch error action or setState
});
```
**Apply to:** `use-onboarding.ts` — every API call's catch block.

### Cancellation Pattern in useEffect
**Source:** `front/features/auth/model/use-telegram-auth.ts` lines 33, 73-75
```typescript
// Prevents setState on unmounted component:
useEffect(() => {
  let cancelled = false;
  // async work:
  somePromise.then((result) => {
    if (cancelled) return;
    // update state
  });
  return () => { cancelled = true; };
}, []);
```
**Apply to:** `use-onboarding.ts` mount effect (getOnboardingStatus call), `LocationStep.tsx` (getCities call).

### Tailwind Height
**Source:** `front/widgets/home/ui/HomeView.tsx` line 15
```typescript
// ALWAYS h-dvh, never h-screen (Telegram WebView requirement)
className="mx-auto flex h-dvh w-full max-w-md flex-col"
```
**Apply to:** `OnboardingFlow.tsx` root `<main>` element.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `roomies back/prisma/seed.ts` | utility | batch | No seed script exists in codebase yet |
| `front/features/onboarding/model/quiz-questions.ts` | constants | — | No hardcoded domain constant files exist in codebase |

---

## Metadata

**Analog search scope:** `roomies back/src/`, `front/features/`, `front/widgets/`, `front/shared/lib/api/`
**Files scanned:** 16 analog files read
**Pattern extraction date:** 2026-06-07
