# Codebase Structure

**Analysis Date:** 2026-05-22

## Directory Layout

```
roomies/
├── front/                          # Telegram Mini App — Next.js 16 (App Router, FSD)
│   ├── app/                        # Next.js routes (lowest FSD layer for routing)
│   │   ├── favicon.ico
│   │   ├── globals.css             # Tailwind v4 entry; defines `--tg-*` CSS vars
│   │   ├── layout.tsx              # Root HTML, Geist fonts, viewport meta, Telegram SDK <Script>
│   │   └── page.tsx                # `/` route — renders `<HomeView />` only
│   ├── views/                      # Page-level compositions (FSD: views layer)
│   │   └── home/
│   │       ├── index.ts            # Slice barrel: exports `HomeView`
│   │       └── ui/
│   │           └── HomeView.tsx    # Header + `<SwipeDeck>`; calls `useTelegramWebApp()`
│   ├── widgets/                    # Composite UI blocks (FSD: widgets layer)
│   │   └── swipe-deck/
│   │       ├── index.ts            # Slice barrel: exports `SwipeDeck`
│   │       └── ui/
│   │           ├── SwipeDeck.tsx   # Wires feature + entity: stack of cards + actions + empty state
│   │           └── EmptyState.tsx  # "Анкеты закончились" + reset button
│   ├── features/                   # User actions (FSD: features layer)
│   │   └── swipe-profile/
│   │       ├── index.ts            # Barrel: `SwipeCard`, `ActionButtons`, `useSwipeDeck`, types
│   │       ├── model/
│   │       │   ├── types.ts            # `SwipeDirection`, `SwipeHandler`
│   │       │   └── use-swipe-deck.ts   # Stack state, exit animation, haptics, reset
│   │       └── ui/
│   │           ├── SwipeCard.tsx       # Pointer drag, threshold/velocity, LIKE/NOPE overlays
│   │           └── ActionButtons.tsx   # Round pass/like buttons
│   ├── entities/                   # Domain models (FSD: entities layer)
│   │   └── profile/
│   │       ├── index.ts            # Barrel: `RoomieProfile` type, `MOCK_PROFILES`, `ProfileCard`
│   │       ├── model/
│   │       │   ├── types.ts            # `RoomieProfile` interface
│   │       │   └── mock-profiles.ts    # Hardcoded 6 demo profiles (Unsplash photos)
│   │       └── ui/
│   │           └── ProfileCard.tsx     # Pure visual card; accepts `overlay` slot
│   ├── shared/                     # Reusable infrastructure (FSD: lowest layer)
│   │   ├── lib/
│   │   │   └── telegram/
│   │   │       ├── index.ts            # Barrel: `getWebApp`, `useTelegramWebApp`, `haptic`, `hapticNotify`
│   │   │       ├── haptic.ts           # `impactOccurred` / `notificationOccurred` wrappers
│   │   │       └── use-telegram-web-app.ts  # SDK init, theme → CSS vars, `themeChanged` subscription
│   │   └── types/
│   │       └── telegram.d.ts       # Ambient `TelegramWebApp` typings on `window.Telegram.WebApp`
│   ├── public/                     # Static assets (Next.js default SVGs — file.svg, globe.svg, ...)
│   ├── AGENTS.md                   # "This is NOT the Next.js you know" — see node_modules/next/dist/docs
│   ├── CLAUDE.md                   # Re-exports AGENTS.md via @AGENTS.md
│   ├── README.md                   # Default Next.js README
│   ├── eslint.config.mjs           # Flat ESLint config (`next/core-web-vitals`)
│   ├── next-env.d.ts               # Generated Next.js ambient types
│   ├── next.config.ts              # `allowedDevOrigins: ['*.trycloudflare.com']`, Unsplash remote image pattern
│   ├── package.json                # Next 16.2.6, React 19.2.4, Tailwind v4
│   ├── package-lock.json
│   ├── postcss.config.mjs          # `@tailwindcss/postcss`
│   ├── tsconfig.json               # `paths: { "@/*": ["./*"] }`, `moduleResolution: bundler`
│   └── tsconfig.tsbuildinfo        # TS incremental cache
│
└── roomies back/                   # NestJS 11 API + Prisma 7
    ├── prisma/
    │   └── schema.prisma           # Postgres schema: User (telegramId BigInt unique), City/District, Squad, Match/Swipe, Chat, Verification, Boost, Purchase, PushToken, NotificationPreference, etc.
    ├── generated/
    │   └── prisma/                 # Prisma-generated client output (not hand-edited)
    ├── src/
    │   ├── main.ts                 # Bootstrap: ValidationPipe, Swagger at /api, BigInt.toJSON patch, PORT
    │   ├── app.module.ts           # Root module: ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule
    │   ├── app.controller.ts       # `GET /` health endpoint
    │   ├── app.controller.spec.ts  # Jest unit test for the hello route
    │   ├── app.service.ts          # Returns "Hello World!"
    │   ├── auth/                   # Telegram Mini App login + JWT
    │   │   ├── auth.module.ts          # JwtModule.registerAsync (secret from JWT_SECRET); exports guard
    │   │   ├── auth.controller.ts      # POST /auth/telegram, GET /auth/me (@UseGuards(JwtAuthGuard))
    │   │   ├── auth.service.ts         # Verify initData → upsert User by telegramId → sign JWT
    │   │   ├── telegram-init-data.ts   # Pure HMAC-SHA256 verifier (secret = HMAC("WebAppData", botToken)); 24h auth_date window
    │   │   ├── jwt-auth.guard.ts       # Bearer extraction + jwt.verifyAsync; attaches { id, telegramId: bigint } to req.user
    │   │   ├── current-user.decorator.ts  # `@CurrentUser()` param decorator
    │   │   └── dto/
    │   │       └── telegram-login.dto.ts  # `TelegramLoginDto` + `AuthTokensDto` (class-validator + Swagger)
    │   └── prisma/                 # Prisma infrastructure module
    │       ├── prisma.module.ts        # `@Global()` — exports PrismaService app-wide
    │       └── prisma.service.ts       # Extends PrismaClient with PrismaPg adapter; $connect on init
    ├── test/
    │   ├── app.e2e-spec.ts         # Default Nest e2e supertest
    │   └── jest-e2e.json           # E2E Jest config
    ├── dist/                       # Build output (nest build) — gitignored in practice
    ├── идеи/                       # Russian: "ideas". Contains `Текстовый документ.txt` (design notes)
    ├── eslint.config.mjs           # Flat ESLint config (typescript-eslint + prettier)
    ├── nest-cli.json               # `sourceRoot: src`, `deleteOutDir: true`
    ├── package.json                # Nest 11, Prisma 7.8, @prisma/adapter-pg, @nestjs/jwt, @nestjs/swagger; jest unit + e2e scripts
    ├── package-lock.json
    ├── prisma.config.ts            # Prisma 7 config: schema path, migrations path, datasource from DATABASE_URL
    ├── README.md                   # Default Nest README
    ├── tsconfig.build.json         # Excludes node_modules, tests, dist
    └── tsconfig.json               # Decorators, ES2023 target
```

## Directory Purposes

### Top-level

**`front/`**
- Purpose: Telegram Mini App client.
- Stack: Next.js 16.2.6 (App Router), React 19.2.4, Tailwind v4, TypeScript 5.
- Architecture: Feature-Sliced Design — five FSD layers (`app`, `views`, `widgets`, `features`, `entities`, `shared`).

**`roomies back/`**
- Purpose: HTTP API serving the Mini App.
- Stack: NestJS 11 (Express), Prisma 7.8 + `@prisma/adapter-pg`, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator`.
- Note the space in the folder name — quote paths in shell commands.

### Frontend FSD layers

**`front/app/` — routing**
- Purpose: Next.js App Router segments and globals.
- Contains: `layout.tsx` (root shell + Telegram SDK script), `page.tsx` (thin route), `globals.css`, favicon.
- Convention: routes stay thin — no business logic, no fetching.

**`front/views/` — page composition**
- Purpose: assemble a screen from widgets.
- Existing slices: `home/`.
- Key files: `home/ui/HomeView.tsx` (header + `<SwipeDeck>` + Telegram SDK bootstrap).

**`front/widgets/` — composite blocks**
- Purpose: glue a feature with one or more entities into a reusable section.
- Existing slices: `swipe-deck/`.
- Key files: `swipe-deck/ui/SwipeDeck.tsx`, `swipe-deck/ui/EmptyState.tsx`.

**`front/features/` — user actions**
- Purpose: own a single interaction including its state and effects.
- Existing slices: `swipe-profile/`.
- Segments: `model/` (`types.ts`, `use-swipe-deck.ts`), `ui/` (`SwipeCard.tsx`, `ActionButtons.tsx`).

**`front/entities/` — domain shapes**
- Purpose: type + presentational component per business entity. No actions.
- Existing slices: `profile/`.
- Segments: `model/` (`types.ts`, `mock-profiles.ts`), `ui/` (`ProfileCard.tsx`).

**`front/shared/` — infrastructure**
- Purpose: framework glue and global typings reusable by everything above.
- Subdirectories: `lib/telegram/` (Telegram SDK wrapper + haptics), `types/` (`telegram.d.ts` ambient declarations).

### Backend modules

**`roomies back/src/`**
- Purpose: NestJS source root (`sourceRoot` in `nest-cli.json`).
- Files: `main.ts` (bootstrap), `app.module.ts` (root), `app.controller.ts` + `app.service.ts` (root health endpoint).

**`roomies back/src/auth/`**
- Purpose: Telegram-based authentication module.
- Key files: `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `telegram-init-data.ts`, `jwt-auth.guard.ts`, `current-user.decorator.ts`.
- Sub: `dto/telegram-login.dto.ts` (input + output DTOs).

**`roomies back/src/prisma/`**
- Purpose: Postgres infrastructure as a `@Global()` Nest module.
- Files: `prisma.module.ts`, `prisma.service.ts` (PrismaClient + `PrismaPg` adapter + lifecycle hooks).

**`roomies back/prisma/`**
- Purpose: Prisma schema home.
- Key file: `schema.prisma` (single-file schema; `@@map` to snake_case tables; Postgres datasource via env).

**`roomies back/generated/prisma/`**
- Purpose: Prisma-generated client output. Generated, do not edit.
- Generated: Yes. Committed: Yes (present in working tree).

**`roomies back/test/`**
- Purpose: E2E tests.
- Files: `app.e2e-spec.ts`, `jest-e2e.json`.
- Unit tests live next to source as `*.spec.ts` (Jest `rootDir: src`).

**`roomies back/dist/`**
- Purpose: TypeScript build output from `nest build`.
- Generated: Yes. Committed: typically no — `deleteOutDir: true` recreates it on every build.

**`roomies back/идеи/`**
- Purpose: design notes / brainstorm (Cyrillic for "ideas"). Contains `Текстовый документ.txt`.
- Generated: No. Committed: Yes.

## Key File Locations

**Entry Points:**
- `roomies back/src/main.ts`: Nest HTTP server bootstrap (port from `PORT`, default 3000).
- `front/app/page.tsx`: Next.js `/` route.
- `front/app/layout.tsx`: Root HTML + Telegram SDK script tag.

**Configuration:**
- `roomies back/prisma.config.ts`: Prisma 7 config (schema path, migrations path, `DATABASE_URL`).
- `roomies back/nest-cli.json`: Nest CLI build settings.
- `roomies back/tsconfig.json` / `tsconfig.build.json`: TypeScript settings.
- `front/next.config.ts`: `allowedDevOrigins: ['*.trycloudflare.com']`, Unsplash image domain.
- `front/tsconfig.json`: `@/*` path alias maps to `./*`.
- `front/postcss.config.mjs`: Tailwind v4 PostCSS plugin.
- `front/eslint.config.mjs` / `roomies back/eslint.config.mjs`: Flat ESLint configs.

**Core Logic:**
- `roomies back/src/auth/auth.service.ts`: login orchestration (verify → upsert → sign).
- `roomies back/src/auth/telegram-init-data.ts`: HMAC verifier.
- `roomies back/src/auth/jwt-auth.guard.ts`: token enforcement.
- `roomies back/src/prisma/prisma.service.ts`: DB client.
- `front/features/swipe-profile/model/use-swipe-deck.ts`: swipe state machine.
- `front/features/swipe-profile/ui/SwipeCard.tsx`: gesture handling.
- `front/shared/lib/telegram/use-telegram-web-app.ts`: SDK init + theme sync.

**Database schema:**
- `roomies back/prisma/schema.prisma`: all models + enums.

**Testing:**
- `roomies back/src/app.controller.spec.ts`: unit test example (co-located).
- `roomies back/test/app.e2e-spec.ts`: e2e example.
- `front/` has no test files yet.

## Naming Conventions

**Files (frontend):**
- React components: `PascalCase.tsx` (`HomeView.tsx`, `SwipeCard.tsx`, `ProfileCard.tsx`).
- Hooks and non-component modules: `kebab-case.ts` (`use-swipe-deck.ts`, `use-telegram-web-app.ts`, `mock-profiles.ts`).
- Ambient types: `*.d.ts` (`telegram.d.ts`).
- Type-only modules inside `model/`: `types.ts`.
- Public surface of every slice: `index.ts` (barrel).

**Files (backend):**
- Nest convention: `<feature>.<role>.ts` — `auth.controller.ts`, `auth.service.ts`, `auth.module.ts`, `prisma.service.ts`.
- DTOs: `*.dto.ts` (`telegram-login.dto.ts`).
- Guards: `*.guard.ts` (`jwt-auth.guard.ts`).
- Decorators: `*.decorator.ts` (`current-user.decorator.ts`).
- Tests: `*.spec.ts` (unit, in `src/`), `*.e2e-spec.ts` (e2e, in `test/`).

**Directories:**
- Frontend: `kebab-case` for slice names (`swipe-profile`, `swipe-deck`); fixed segment names `ui/` and `model/`.
- Backend: `kebab-case` features (`auth`, `prisma`); standard Nest segments (`dto/`).

**Identifiers:**
- TypeScript: `PascalCase` types/components, `camelCase` functions/variables, `SCREAMING_SNAKE_CASE` constants (`MOCK_PROFILES`, `SWIPE_EXIT_DURATION_MS`).
- Prisma: `PascalCase` models, `camelCase` fields, snake_case DB names via `@map` / `@@map`.

## Where to Add New Code

**New backend feature (e.g. `profile`, `swipe`, `match`):**
- Create `roomies back/src/<feature>/` with `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`.
- Add `dto/` subfolder for input/output shapes (use `class-validator` + `@nestjs/swagger`).
- Register the module in `roomies back/src/app.module.ts`'s `imports` array.
- Inject `PrismaService` directly — it's available globally via `PrismaModule`.
- Protect routes with `@UseGuards(JwtAuthGuard)` and pull the principal via `@CurrentUser()` (`roomies back/src/auth/current-user.decorator.ts`); the guard needs `AuthModule` to be imported by the feature module to access `JwtService`.

**New backend table/model:**
- Edit `roomies back/prisma/schema.prisma`. Add `@@map` to snake_case the table and `@map` for columns.
- Run `prisma migrate dev` (config in `prisma.config.ts`). Regenerated client lands in `roomies back/generated/prisma/`.

**New frontend route:**
- Create `front/app/<segment>/page.tsx` (App Router). Keep it thin — import a view.

**New frontend view (page composition):**
- Create slice `front/views/<view-name>/` with `index.ts` + `ui/<ViewName>.tsx`.
- Export from `index.ts`; import in `app/<route>/page.tsx`.

**New frontend widget:**
- Create slice `front/widgets/<widget-name>/` with `index.ts` and `ui/`.
- Compose features and entities; do not own action logic — delegate to a feature hook.

**New frontend feature (user action):**
- Create slice `front/features/<feature-name>/` with `index.ts`, `model/` (types, hooks), `ui/` (action UI).
- Export public symbols from `index.ts`; import from `@/features/<feature-name>` everywhere else.

**New frontend entity (domain shape):**
- Create slice `front/entities/<entity-name>/` with `index.ts`, `model/types.ts`, `ui/<EntityName>Card.tsx` (or similar).
- Keep purely presentational; expose `overlay` / `slots` instead of hard-coding feature UI inside.

**Shared utility / SDK wrapper:**
- Put it under `front/shared/lib/<topic>/` with its own `index.ts` barrel.
- Global ambient typings go in `front/shared/types/*.d.ts`.

**Tests (backend):**
- Unit: co-locate as `<file>.spec.ts` next to the implementation (Jest `rootDir: src`).
- E2E: add to `roomies back/test/*.e2e-spec.ts`; run with `npm run test:e2e`.

**Tests (frontend):**
- No framework configured yet. Add Vitest or Jest + RTL before introducing the first test, then co-locate as `<Component>.test.tsx`.

## Special Directories

**`roomies back/generated/prisma/`**
- Purpose: Prisma client output.
- Generated: Yes (via `prisma generate`).
- Committed: Yes (present in tree). Do not hand-edit.

**`roomies back/dist/`**
- Purpose: compiled JS from `nest build`.
- Generated: Yes. Recreated each build (`deleteOutDir: true`).

**`front/.next/`** (not present in tree but expected at runtime)
- Purpose: Next.js build cache / dev artifacts.
- Generated: Yes. Skip when mapping/searching.

**`front/public/`**
- Purpose: static assets served at site root. Currently holds Next.js boilerplate SVGs.
- Generated: No. Committed: Yes.

**`roomies back/идеи/`**
- Purpose: design notes (Cyrillic name — "ideas"). Plain-text scratch space.
- Generated: No. Committed: Yes.

**`node_modules/` (both halves)**
- Generated: Yes. Skip during mapping. Note: backend ships Prisma docs and Nest schematics here, frontend ships Next.js internal docs at `node_modules/next/dist/docs/` (referenced by `front/AGENTS.md`).

---

*Structure analysis: 2026-05-22*
