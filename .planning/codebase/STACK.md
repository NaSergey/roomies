# Technology Stack

**Analysis Date:** 2026-05-22

This is a two-app monorepo (no workspace manifest at the root): a Next.js Telegram Mini App frontend in `front/` and a NestJS API backend in `roomies back/`. Each side has its own `package.json`, `tsconfig.json`, and lockfile and is installed/run independently.

## Languages

**Primary:**
- TypeScript — both apps. Frontend `tsconfig.json` targets `ES2017`, backend `tsconfig.json` targets `ES2023`.
  - Frontend strict mode: full `strict: true` (`front/tsconfig.json:7`).
  - Backend strict mode: `strictNullChecks: true`, but `noImplicitAny: false` and `strictBindCallApply: false` (`roomies back/tsconfig.json:18-22`) — looser than frontend.
- TSX — React components in `front/`.
- Prisma schema language — `roomies back/prisma/schema.prisma` (PostgreSQL provider).

**Secondary / config:**
- JavaScript / `.mjs` — config files only (`front/eslint.config.mjs`, `front/postcss.config.mjs`).
- JSON — `tsconfig*.json`, `nest-cli.json`, `package.json`.

## Runtime

**Environment:**
- Node.js — version not pinned via `.nvmrc` or `engines` field in either `package.json`. `@types/node` is `^20` in `front/package.json:19` and `^22.10.7` in `roomies back/package.json:47`, implying Node 20+ on the frontend and Node 22+ on the backend in practice.
- Browser runtime (frontend): React 19 client + Telegram Mini App WebView (Telegram client embeds `https://telegram.org/js/telegram-web-app.js`).
- Server runtime (backend): NestJS HTTP server via `@nestjs/platform-express`. Default port `process.env.PORT ?? 3000` (`roomies back/src/main.ts:32`).

**Package Manager:**
- npm — implied by the `npm:dev` reference in `front/package.json:10` (`concurrently "npm:dev"`). No `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` files were located at either app root (lockfiles either gitignored or not committed in this snapshot). Treat npm as the convention until a lockfile lands.

## Frameworks

**Core (frontend — `front/package.json`):**
- `next` `16.2.6` — App Router with Turbopack as the default bundler (Next.js 16 breaking change vs 15: `next dev` and `next build` use Turbopack by default; no `--turbo` flag needed). The `dev` script is plain `next dev --hostname 0.0.0.0` (`front/package.json:6`), so Turbopack is implicit.
- `react` `19.2.4`, `react-dom` `19.2.4` — React 19 client. The frontend uses the App Router (`front/app/layout.tsx`, `front/app/page.tsx`) with a Server Component root layout and `'use client'` boundaries inside `front/shared/lib/telegram/*`.

**Core (backend — `roomies back/package.json`):**
- `@nestjs/common` `^11.0.1`, `@nestjs/core` `^11.0.1`, `@nestjs/platform-express` `^11.0.1` — NestJS 11 on Express.
- `@nestjs/config` `^4.0.4` — env via `ConfigModule.forRoot({ isGlobal: true })` (`roomies back/src/app.module.ts:10`). `dotenv ^17.4.2` is a devDependency for local `.env` loading.
- `@nestjs/jwt` `^11.0.2` — JWT issuance and verification (`roomies back/src/auth/auth.module.ts`, `roomies back/src/auth/jwt-auth.guard.ts`).
- `@nestjs/swagger` `^11.4.3` + `swagger-ui-express` `^5.0.1` — OpenAPI UI mounted at `/api` (`roomies back/src/main.ts:30`).
- `class-validator` `^0.15.1` + `class-transformer` `^0.5.1` — DTO validation; enforced globally via `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in `roomies back/src/main.ts:14-20`.
- `reflect-metadata` `^0.2.2` — required by Nest's decorator-based DI; `experimentalDecorators` and `emitDecoratorMetadata` are on in `roomies back/tsconfig.json:11-12`.
- `rxjs` `^7.8.1` — Nest's reactive primitives.

**ORM / database driver:**
- `prisma` `^7.8.0` (CLI / migrations) + `@prisma/client` `^7.8.0` (generated client) — `roomies back/package.json:29-34`.
- `@prisma/adapter-pg` `^7.8.0` + `pg` `^8.20.0` + `@types/pg` `^8.20.0` — Prisma 7 uses the driver-adapter architecture. The Postgres adapter is constructed in `roomies back/src/prisma/prisma.service.ts:11` (`new PrismaPg({ connectionString: process.env.DATABASE_URL })`) and passed to `super({ adapter })`. There is no `@prisma/client` `previewFeatures = ["driverAdapters"]` flag visible because Prisma 7 made driver adapters the default.
- Database provider: `postgresql` (`roomies back/prisma/schema.prisma:6`).
- `BigInt.prototype.toJSON` is monkey-patched to `toString()` in `roomies back/src/main.ts:7-9` so Prisma's `BigInt` columns (e.g. `User.telegramId`, `Message.id`) survive `JSON.stringify`.

**Testing (backend):**
- `jest` `^30.0.0`, `@types/jest` `^30.0.0`, `ts-jest` `^29.2.5` — Jest 30 with TS transform. Config is inline in `roomies back/package.json:66-82`: `rootDir: src`, `testRegex: .*\\.spec\\.ts$`, `testEnvironment: node`.
- `supertest` `^7.0.0` + `@types/supertest` `^6.0.2` — HTTP integration tests.
- `@nestjs/testing` `^11.0.1` — Nest test module.
- E2E config: `roomies back/test/jest-e2e.json` is referenced by the `test:e2e` script (`roomies back/package.json:20`) but was not opened during this analysis.
- Currently only one spec exists: `roomies back/src/app.controller.spec.ts`.

**Testing (frontend):**
- None. No `jest`, `vitest`, `@testing-library/*`, or Playwright dependencies present in `front/package.json`. There are no test scripts and no test files.

**Build / dev tools:**
- Turbopack — bundled into `next` `16.2.6`; default for both `next dev` and `next build` in v16.
- `@nestjs/cli` `^11.0.0`, `@nestjs/schematics` `^11.0.0` — `nest build` / `nest start` commands. Build output to `./dist` (`roomies back/tsconfig.json:15`).
- `ts-loader` `^9.5.2` — webpack TS loader used by the Nest CLI compiler.
- `ts-node` `^10.9.2` + `tsconfig-paths` `^4.2.0` — used by the `test:debug` script.
- `source-map-support` `^0.5.21` — backend dev dep.
- `concurrently` `^9.2.1` (frontend) — runs `next dev` and the Cloudflare quick-tunnel in parallel (see INTEGRATIONS.md).

**Styling (frontend):**
- `tailwindcss` `^4` + `@tailwindcss/postcss` `^4` — Tailwind v4 (zero-config, CSS-first). PostCSS pipeline configured in `front/postcss.config.mjs` with just the `@tailwindcss/postcss` plugin. There is no `tailwind.config.{js,ts}` file (v4 reads design tokens from `globals.css` directives).
- Google Fonts via `next/font/google` — `Geist` and `Geist_Mono` loaded in `front/app/layout.tsx:6-7` and exposed as CSS variables `--font-geist-sans` / `--font-geist-mono`.

**Linting & formatting:**
- Frontend: `eslint` `^9` + `eslint-config-next` `16.2.6`. Flat config in `front/eslint.config.mjs` composes `core-web-vitals` and `typescript` presets from `eslint-config-next`. No Prettier config in `front/`.
- Backend: `eslint` `^9.18.0`, `typescript-eslint` `^8.20.0`, `@eslint/js` `^9.18.0`, `@eslint/eslintrc` `^3.2.0`, `globals` `^16.0.0`. Flat config at `roomies back/eslint.config.mjs` (not opened). `prettier` `^3.4.2` configured via `roomies back/.prettierrc`, integrated with ESLint through `eslint-config-prettier` `^10.0.1` and `eslint-plugin-prettier` `^5.2.2`.

## Key Dependencies

**Critical (backend):**
- `@nestjs/core` `^11.0.1` — DI / HTTP server; without it nothing boots.
- `@prisma/client` `^7.8.0` + `@prisma/adapter-pg` `^7.8.0` — sole data access layer. Schema is the source of truth (`roomies back/prisma/schema.prisma`).
- `@nestjs/jwt` `^11.0.2` — only auth mechanism. JWT secret comes from `JWT_SECRET` (`config.getOrThrow` in `roomies back/src/auth/auth.module.ts:14`); TTL defaults to 7 days from `JWT_ACCESS_TTL_SECONDS` (`roomies back/src/auth/auth.service.ts:24-26`).
- `class-validator` + `class-transformer` — global `ValidationPipe` rejects unknown DTO fields (`forbidNonWhitelisted: true`).

**Critical (frontend):**
- `next` `16.2.6` — entire frontend runtime.
- `react` / `react-dom` `19.2.4` — React 19 features (Actions, `use`, async transitions) are available; no usage has been audited yet.
- Telegram WebApp SDK — **loaded via CDN `<Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />` in `front/app/layout.tsx:33-36`, not an npm package.** Outage of `telegram.org` breaks the app inside Telegram clients that don't already cache the script.

**Infrastructure:**
- `pg` `^8.20.0` — Postgres driver under the Prisma adapter.
- `swagger-ui-express` `^5.0.1` — serves the OpenAPI viewer at `/api`.

**Notably absent:**
- No HTTP client on the frontend (no `axios`, no `fetch` wrapper, no API SDK). A repo-wide grep for `fetch(`, `axios`, `api\\.` against `front/` returned zero matches in app code — the frontend has not yet been wired to the backend.
- No state-management library (no `zustand`, `redux`, `jotai`, `react-query`, `@tanstack/*`).
- No form/validation library on the frontend (no `react-hook-form`, `zod`, `yup`).
- No logger on either side beyond `console`.
- No CORS package on the backend; `app.enableCors()` is not called in `roomies back/src/main.ts`. Cross-origin requests from the Cloudflare tunnel domain will be rejected by browsers if/when the frontend starts calling the backend.
- No rate limiting (`@nestjs/throttler`), no helmet, no compression middleware.
- No CI manifests (`.github/workflows`, etc.) located in this analysis.

## Configuration

**Environment (backend):**
- `.env` file exists at `roomies back/.env` (existence only — contents not read). Loaded by `ConfigModule.forRoot({ isGlobal: true })`.
- Required variables (verified from source):
  - `DATABASE_URL` — Postgres connection string, consumed in `roomies back/src/prisma/prisma.service.ts:11`.
  - `TELEGRAM_BOT_TOKEN` — `config.getOrThrow` in `roomies back/src/auth/auth.service.ts:23`, so missing value crashes on boot.
  - `JWT_SECRET` — `config.getOrThrow` in `roomies back/src/auth/auth.module.ts:14`, same boot-fail behaviour.
- Optional variables:
  - `JWT_ACCESS_TTL_SECONDS` — defaults to `60 * 60 * 24 * 7` (7 days) when unset (`roomies back/src/auth/auth.service.ts:25`).
  - `PORT` — defaults to `3000` (`roomies back/src/main.ts:32`).

**Environment (frontend):**
- No `.env*` file found in `front/`. No `NEXT_PUBLIC_*` variables are referenced anywhere in the application code that was audited.

**Build config (frontend):**
- `front/next.config.ts` — declares `allowedDevOrigins: ['*.trycloudflare.com']` (Next.js 16 requires this for cross-origin dev requests from non-`localhost` hosts) and one Unsplash `remotePatterns` entry for `next/image`. The file uses the typed `NextConfig` import.
- `front/tsconfig.json` — `moduleResolution: bundler`, `jsx: react-jsx`, `paths: { "@/*": ["./*"] }`, and the `next` TypeScript plugin in `plugins`.
- `front/postcss.config.mjs` — Tailwind v4 only.
- `front/eslint.config.mjs` — Next flat config.

**Build config (backend):**
- `roomies back/nest-cli.json` — `sourceRoot: src`, `deleteOutDir: true`.
- `roomies back/tsconfig.json` and `roomies back/tsconfig.build.json` — second file exists but was not inspected; presumed standard Nest exclude-tests build config.

## Platform Requirements

**Development:**
- Node 20+ (frontend) / 22+ (backend) — inferred from `@types/node` ranges; no `engines` enforcement.
- Postgres reachable at `DATABASE_URL` (any Postgres-compatible service: local, Supabase, Neon, RDS, etc. — the codebase does not bind to a specific provider).
- A Telegram bot token (for `TELEGRAM_BOT_TOKEN`), and the bot must be registered as a Mini App so it can deliver signed `initData` to the Web View.
- `cloudflared` CLI on PATH to use the `tunnel` script (`front/package.json:10`). Used to expose the local dev server over HTTPS so the Telegram client can load the Mini App.

**Production:**
- No deployment manifests in the repo: no `Dockerfile`, `docker-compose.yml`, `Procfile`, `vercel.json`, `render.yaml`, `fly.toml`, `serverless.yml`, or `*.tf` files were located during this analysis. Deployment target is undefined.
- The backend produces a Node bundle in `dist/` via `nest build` and is launched with `node dist/main` (`roomies back/package.json:14`).
- The frontend runs `next start` after `next build`. Next.js 16 still supports both Node server and `output: 'standalone'`, but no `output` mode is configured.

---

*Stack analysis: 2026-05-22*
