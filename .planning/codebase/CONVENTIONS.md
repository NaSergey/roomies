# Coding Conventions

**Analysis Date:** 2026-05-22

This repo has two halves with distinct rule sets. The frontend follows Feature-Sliced Design (FSD) on Next.js 16 + Tailwind 4. The backend follows NestJS 11 module-per-feature with Prisma 7. Both are strict-typed TypeScript projects.

## Frontend — Feature-Sliced Design (FSD)

### Layer Ordering

Strict one-way dependency: **`app` → `views` → `widgets` → `features` → `entities` → `shared`**. A layer may only import from layers below it. Verified in `front/`:

- `app/page.tsx` imports from `@/views/home` only — no logic in app router pages.
- `views/home/ui/HomeView.tsx` composes `@/widgets/swipe-deck`, `@/shared/lib/telegram`, `@/entities/profile`.
- `widgets/swipe-deck/ui/SwipeDeck.tsx` composes `@/features/swipe-profile` and `@/entities/profile`.
- `features/swipe-profile/ui/SwipeCard.tsx` imports `@/entities/profile`.
- `entities/profile/ui/ProfileCard.tsx` imports only relative types — no upstream imports.
- `shared/lib/telegram/*` has no project imports.

**Never reach sideways within a layer or upward.** A widget must not import another widget; a feature must not import another feature.

### Public API via Barrel `index.ts`

Every slice exposes its public surface through a single `index.ts` file at its root. Consumers import from the slice root, never from internal paths.

Examples:
- `entities/profile/index.ts` re-exports `RoomieProfile`, `MOCK_PROFILES`, `ProfileCard`.
- `features/swipe-profile/index.ts` re-exports `SwipeCard`, `ActionButtons`, `useSwipeDeck`, `SWIPE_EXIT_DURATION_MS`, `SwipeDirection`, `SwipeHandler`.
- `widgets/swipe-deck/index.ts` re-exports `SwipeDeck`.
- `views/home/index.ts` re-exports `HomeView`.
- `shared/lib/telegram/index.ts` re-exports `getWebApp`, `useTelegramWebApp`, `haptic`, `hapticNotify`.

**Rule:** Import `from '@/features/swipe-profile'` — never `from '@/features/swipe-profile/ui/SwipeCard'`.

### Slice Segments

Each slice (entity / feature / widget / view) is organized into segments:

- **`ui/`** — React components (`.tsx`), one component per file. PascalCase filenames matching the export.
- **`model/`** — types, hooks, state, pure logic. kebab-case filenames (`types.ts`, `mock-profiles.ts`, `use-swipe-deck.ts`).
- **`lib/`** (shared only) — pure helpers grouped by domain, e.g. `shared/lib/telegram/`.

Type-only files are named `types.ts`. Hooks are named `use-*.ts` (kebab-case file, `useXxx` exported name).

### Path Alias

`tsconfig.json` defines a single alias: `"@/*": ["./*"]` from the project root (`front/`). All cross-slice imports use `@/...`. Within a slice, use relative imports (`../model/types`).

### Component Conventions

- **`'use client'` directive** at the top of any file that uses hooks, state, refs, browser APIs, or event handlers. Present in every `ui/*.tsx` for `features`, `widgets`, `views`, plus `entities/profile/ui/ProfileCard.tsx` (because it composes into client trees). Pure server-only files (e.g. `app/layout.tsx`, `app/page.tsx`) omit it.
- **Function components only**, exported as named exports (`export function ProfileCard(...)`). No default exports for components except Next.js route files (`app/page.tsx`, `app/layout.tsx`) which require default exports.
- **Props interfaces** are declared inline above the component as `interface XxxProps { ... }`, never exported (unless the slice deliberately re-exports it via `index.ts`).
- **Naming:**
  - Components: `PascalCase` (`SwipeCard`, `ProfileCard`, `HomeView`, `EmptyState`).
  - Hooks: `useCamelCase` (`useSwipeDeck`, `useTelegramWebApp`).
  - Constants: `SCREAMING_SNAKE_CASE` (`MOCK_PROFILES`, `SWIPE_EXIT_DURATION_MS`, `SWIPE_THRESHOLD`).
  - File names for slice segments: kebab-case for `model/` (`use-swipe-deck.ts`), PascalCase for `ui/` (`SwipeCard.tsx`).
  - Slice directory names: kebab-case (`swipe-profile`, `swipe-deck`).

### Styling — Tailwind 4

- **PostCSS plugin only:** `postcss.config.mjs` registers `@tailwindcss/postcss`. No `tailwind.config.js` — Tailwind 4 config lives in CSS.
- **CSS entry:** `app/globals.css` starts with `@import "tailwindcss";` (Tailwind 4 syntax, not the v3 `@tailwind base/components/utilities`).
- **`@theme inline` block** in `globals.css` maps semantic tokens (`--color-background`, `--font-sans`) to the underlying CSS variables. New design tokens go in this block.
- **Telegram theme variables**: prefix `--tg-*` (`--tg-bg`, `--tg-text`, `--tg-secondary-bg`, `--tg-button`, `--tg-button-text`, `--tg-hint`). Default values are defined in `:root` in `globals.css`. They are overwritten at runtime from `Telegram.WebApp.themeParams` by `useTelegramWebApp` in `shared/lib/telegram/use-telegram-web-app.ts`.
- **Consuming the variables in JSX:** use Tailwind arbitrary values with a fallback, e.g. `bg-[var(--tg-secondary-bg,#1c1c1e)]`, `bg-[var(--tg-button,#3390ec)]`. Always include the literal fallback for outside-Telegram rendering.
- **No CSS modules, no styled-components, no emotion.** All component styling is Tailwind utility classes inline in JSX.
- **Mobile-first viewport:** use `h-[100dvh]` (not `h-screen`) so the layout accounts for Telegram's collapsing UI and the mobile browser address bar.

### State and Effects

- **Local state via `useState` / `useRef`** is the default. No global store (Redux, Zustand) currently in use.
- **Hooks live in `model/use-*.ts`** of their owning slice. A feature owns the rule of "how to handle a swipe" (`useSwipeDeck`); shared owns DOM/SDK integration (`useTelegramWebApp`).
- **`useCallback` for stable handlers** passed across component boundaries (see `useSwipeDeck`).
- **Side-effects with cleanup**: in `useTelegramWebApp`, the `themeChanged` listener is removed in the effect's cleanup function.

### Comments — Russian, "why-only"

- **User-facing strings are Russian.** Examples: `'Найди соседа по вайбу'`, `'Анкеты закончились'`, `'Фильтры'`, `'Начать заново'`. The product is Russian-language.
- **Code comments are Russian and minimal.** Comment only when the WHY is non-obvious. Examples actually present:
  - `// dvh — учитывает скрывающийся UI Telegram и адресную строку браузера`
  - `// Парент через onSwipe выставит exitDirection → анимация вылета.`
  - `// Хук в feature — фича владеет правилом «как обрабатывать свайп».`
  - `// Тонкий entry-point Next.js: только маршрут → view.`
- **Do not comment WHAT the code does** — the code already says that. Comment thresholds, rationale for picks, cross-file invariants.

### TypeScript

- **`strict: true`** in `front/tsconfig.json`.
- **`noEmit: true`** — TypeScript is used purely for type-checking; Next.js handles the build.
- **`module: "esnext"`, `moduleResolution: "bundler"`** — ESM modules, bundler-style resolution.
- **`jsx: "react-jsx"`** — no need to import React in `.tsx` files.
- **`isolatedModules: true`** — each file must be independently transpilable. Use `export type { ... }` and `import type { ... }` for type-only re-exports (see `entities/profile/index.ts`, `features/swipe-profile/index.ts`).
- **Type-only imports** are explicit: `import type { ReactNode } from 'react'`, `import type { RoomieProfile } from '@/entities/profile'`.
- **Global ambient types** for window-level SDKs live in `shared/types/*.d.ts` (e.g. `telegram.d.ts` declares `TelegramWebApp`, `Window.Telegram`).

### Linting / Formatting

- **ESLint** via `eslint-config-next` flat config (`eslint.config.mjs`): `nextVitals` + `nextTs`. Ignores `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
- **No Prettier config** in `front/` — formatting follows defaults / editor settings. Indentation: 2 spaces. Single quotes for strings, double quotes inside JSX attributes (consistent with what's in the codebase).

## Backend — NestJS 11

### Module-per-Feature Layout

Each feature lives in `roomies back/src/<feature>/` with at minimum:
- `<feature>.module.ts` — `@Module({...})` declaration.
- `<feature>.controller.ts` — HTTP entry points.
- `<feature>.service.ts` — business logic.
- `dto/<action>.dto.ts` — request and response DTOs.
- Domain-specific helpers as needed (`telegram-init-data.ts`, `jwt-auth.guard.ts`, `current-user.decorator.ts`).

Current modules: `auth/`, `prisma/`, plus the root `AppModule`.

### Bootstrap (`main.ts`)

- **BigInt JSON patch** at the top of `main.ts`: `JSON.stringify` can't serialize `BigInt` natively. The fix is a `BigInt.prototype.toJSON = () => string` monkey-patch applied before the Nest factory runs. This is required because `User.telegramId` is `BigInt`.
- **Global `ValidationPipe`** with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`. Every DTO is automatically validated; unknown properties are rejected, not silently dropped.
- **Swagger** at `/api` via `DocumentBuilder` + `SwaggerModule`. Bearer auth is declared (`addBearerAuth()`).
- **Port from `process.env.PORT` with `?? 3000` fallback.**

### Module Composition

`AppModule` imports `ConfigModule.forRoot({ isGlobal: true })` so `ConfigService` is available everywhere without re-importing. `PrismaModule` is `@Global()` (`prisma/prisma.module.ts`), so `PrismaService` is also available everywhere via DI without re-importing.

### Controllers

- **Decorator order on routes:** `@Method('path')` → `@HttpCode(...)` (when not the default) → `@UseGuards(...)` → `@ApiBearerAuth()` → `@ApiOperation(...)` → `@ApiResponse(...)`. Example from `auth.controller.ts`:
  ```
  @Post('telegram')
  @HttpCode(200)
  @ApiOperation({ summary: 'Авторизация через Telegram Mini App initData' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  ```
- **Class-level `@ApiTags('<feature>')`** and `@Controller('<feature>')` use the same kebab-case route prefix as the module folder.
- **Inject services via constructor** with `private readonly`: `constructor(private readonly auth: AuthService) {}`.
- **Controllers stay thin**: they parse input, delegate to the service, return the result. No business logic.

### DTOs

- DTOs live in `<feature>/dto/<action>.dto.ts`. One file may contain both request and response classes (see `dto/telegram-login.dto.ts` defining `TelegramLoginDto` and `AuthTokensDto`).
- **`class-validator` decorators** on every input field: `@IsString()`, `@MinLength(1)`, etc.
- **`@ApiProperty({ description, example })`** on every field for Swagger.
- **Definite assignment `!`** on required DTO fields (`initData!: string`) — the global `ValidationPipe` guarantees presence at runtime.
- **`class-transformer`** is on the dependency list; rely on `transform: true` in the global pipe to coerce primitives.

### Auth Pattern

- **`JwtAuthGuard`** (`auth/jwt-auth.guard.ts`) reads `Authorization: Bearer <token>`, verifies with `JwtService`, assigns `req.user = { id, telegramId }` (telegramId restored as `BigInt`).
- **`@CurrentUser()` param decorator** (`auth/current-user.decorator.ts`) reads `req.user` from the request. Use it to inject the authenticated user into route handlers: `me(@CurrentUser() user: { id: number; telegramId: bigint })`.
- **Protected routes** combine `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` so Swagger renders the auth button.
- **`JwtModule.registerAsync`** with `ConfigService` injection — secret comes from `JWT_SECRET` env var via `config.getOrThrow<string>('JWT_SECRET')`.
- **`AuthModule` exports** `AuthService`, `JwtAuthGuard`, and `JwtModule` so other features can guard their routes without re-wiring JWT.

### Config / Env

- **`ConfigService.getOrThrow<T>('VAR')`** for required env vars (fail-fast at boot).
- **`ConfigService.get<T>('VAR')` with `??` fallback** for optional values (see `JWT_ACCESS_TTL_SECONDS` default in `AuthService`).
- Required env vars: `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`. Optional: `JWT_ACCESS_TTL_SECONDS`, `PORT`.

### Error Handling

- **Throw Nest exceptions, not raw `Error`**: `UnauthorizedException`, etc. Nest maps them to HTTP statuses automatically.
- **Domain errors are custom classes** (e.g. `InvalidInitDataError extends Error`) thrown from pure helpers (`telegram-init-data.ts`), then caught at the service layer and re-thrown as Nest exceptions:
  ```
  try { parsed = verifyTelegramInitData(...); }
  catch (e) {
    if (e instanceof InvalidInitDataError) throw new UnauthorizedException(e.message);
    throw e;
  }
  ```
- **Pure helpers must not import Nest** (`telegram-init-data.ts` only uses `node:crypto`). This keeps them unit-testable in isolation.

### Prisma Conventions

- **Snake-case database columns via `@map`**: every field maps its camelCase model field to a snake_case column. Example: `telegramId BigInt @unique @map("telegram_id")`.
- **Snake-case plural table names via `@@map`**: `@@map("users")`, `@@map("user_photos")`, `@@map("squad_invites")`. Always plural.
- **Enums use snake_case values** matching the database: `looking_housing_roomie`, `super_like`, `call_invite`. Enum type names are PascalCase: `ScenarioType`, `SwipeAction`, `MessageType`.
- **Composite primary keys** for join tables: `@@id([userId, tagId])` on `UserVibeTag`, `@@id([squadId, userId])` on `SquadMember`.
- **Indexes** for every foreign key reverse lookup and every common query path. Multi-column indexes ordered for query selectivity. Sort direction is explicit when descending (`@@index([actorId, createdAt(sort: Desc)])`).
- **Cascade deletes** on user-owned relations: `onDelete: Cascade` on `UserPhoto`, `UserVibeTag`, `Swipe`, `Message`, etc. Without cascade for ownership-neutral relations (e.g. `District -> City`).
- **BigInt for Telegram and high-volume tables**: `User.telegramId`, `Message.id`, `BehavioralEvent.id` are `BigInt`. Plain Int elsewhere.
- **Decimal precision pinned**: lifestyle scales `Decimal(3, 2)` (0.00–1.00), match scores `Decimal(5, 4)`.
- **String length limits**: `@db.VarChar(N)` everywhere strings have a known cap. Free-form text uses unconstrained `String`.
- **JSON columns documented inline** with a Russian comment showing the expected shape (see `QuizQuestion.options`, `Match.matchReasons`).
- **Invariants Prisma can't express** are documented with a comment pointing to the SQL migration that adds the CHECK constraint (see `Match.user1Id` comment about `user1Id < user2Id`).

### PrismaService Pattern

`PrismaService extends PrismaClient` and implements `OnModuleInit` / `OnModuleDestroy` to wire connect/disconnect into the Nest lifecycle. Uses the `@prisma/adapter-pg` PG driver adapter with `DATABASE_URL`. `PrismaModule` is `@Global()` so `PrismaService` injects everywhere without re-importing the module.

### TypeScript (backend)

- **`module: "nodenext"`, `moduleResolution: "nodenext"`** — ESM in Node mode.
- **`strictNullChecks: true`**, but `noImplicitAny: false` and `strictBindCallApply: false` — looser than the frontend.
- **`emitDecoratorMetadata: true`, `experimentalDecorators: true`** — required for Nest DI and class-validator.
- **`target: "ES2023"`**, `outDir: "./dist"`, source maps on.
- **`removeComments: true`** — comments are stripped from the build.

### Linting / Formatting

- **ESLint** flat config (`eslint.config.mjs`) extends `eslint.configs.recommended` + `tseslint.configs.recommendedTypeChecked` + `eslint-plugin-prettier/recommended`. Project-service-based type checking enabled.
- **Custom rules:**
  - `@typescript-eslint/no-explicit-any`: off (pragmatic for SDK boundaries).
  - `@typescript-eslint/no-floating-promises`: warn.
  - `@typescript-eslint/no-unsafe-argument`: warn.
  - `prettier/prettier`: error, `endOfLine: "auto"` (Windows-friendly).
- **Prettier** (`.prettierrc`): `singleQuote: true`, `trailingComma: "all"`. Indent: 2 spaces.

### Comments — Russian, "why-only" (same as frontend)

Backend comments are Russian and reserve commentary for WHY, invariants, and pointers to off-schema constraints. Examples from `schema.prisma` and `main.ts`:
- `// JSON.stringify не умеет BigInt — приводим к строке.`
- `// BigInt — Telegram user id может превышать диапазон Int32.`
- `// scenario обязателен в схеме — задаём дефолт, пользователь поменяет в онбординге.`
- `// ВАЖНО: в слое приложения всегда гарантировать user1Id < user2Id перед вставкой`

User-facing strings in Swagger and exceptions are Russian (`'Авторизация через Telegram Mini App initData'`, `'initData невалиден или просрочен'`). Internal error messages thrown from helpers (`'hash is missing'`, `'initData expired'`) are English — they are developer diagnostics, not end-user text.

## Cross-Cutting

### Module System

- **Frontend:** ESM (`module: "esnext"`).
- **Backend:** ESM (`module: "nodenext"`), but the ESLint config sets `sourceType: 'commonjs'` for the lint run only.

### File Encoding / Line Endings

- Prettier's `endOfLine: "auto"` accepts either. Windows users keep CRLF; the project does not enforce LF.

### What Not to Do

- **Do not** import across FSD layers upward or sideways. A widget importing another widget is a violation; fix by hoisting shared logic into a lower layer.
- **Do not** import slice internals — go through the slice's `index.ts`.
- **Do not** put business logic in `app/page.tsx` or in Nest controllers — both are entry points.
- **Do not** add `tailwind.config.js` to the frontend — Tailwind 4 lives in CSS via `@theme inline`.
- **Do not** add JSDoc blocks describing what a function does. Keep comments to non-obvious WHY only.
- **Do not** quote contents of `.env`, secrets, or `TELEGRAM_BOT_TOKEN` values into the repo.
- **Do not** drop the `BigInt.prototype.toJSON` patch in `main.ts` — responses with `telegramId` will throw without it.
- **Do not** add new Prisma fields without `@map(...)` snake-case mapping; the database convention is snake_case columns.

---

*Convention analysis: 2026-05-22*
