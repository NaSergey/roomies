# External Integrations

**Analysis Date:** 2026-05-22

The product is intentionally minimal in third-party surface area. The only live external integrations today are Telegram (for auth + Mini App shell), Postgres (for persistence), and a Cloudflare quick-tunnel (dev-only). Image hosting via Unsplash is referenced but only for mock data.

## Frontend → Backend wiring status

**The frontend currently does NOT call the backend.**

- Repo-wide grep across `front/` for `fetch(`, `axios`, and `api.` returned zero matches in application code (only Next.js's own compiled `dist/api/*` showed up).
- There is no API client module, no environment variable pointing at the backend's URL, and no `NEXT_PUBLIC_*` config in `front/`.
- The backend's `POST /auth/telegram` endpoint (`roomies back/src/auth/auth.controller.ts:13`) is reachable only via Swagger UI or a manual HTTP client at this stage.
- Consequence: the JWT issued by `AuthService.loginWithTelegram` is currently un-consumed by the UI. The Mini App reads `window.Telegram.WebApp` (theme, haptics, viewport) but never POSTs `initData` to the backend yet.

This is the **single most important integration gap** to address before any data-bound feature can ship.

## APIs & External Services

**Telegram Mini App / WebApp SDK:**
- Loaded in the browser via `<Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />` in `front/app/layout.tsx:33-36`. **Not an npm package** — the SDK is fetched from `telegram.org` at runtime, so an outage of that CDN leaves the app without `window.Telegram.WebApp`.
- Frontend wrapper: `front/shared/lib/telegram/use-telegram-web-app.ts`
  - `getWebApp()` returns `window.Telegram?.WebApp ?? null` and is SSR-safe (`typeof window === 'undefined'` guard).
  - `useTelegramWebApp()` hook calls `wa.ready()` + `wa.expand()`, copies Telegram theme params (`bg_color`, `text_color`, `hint_color`, `secondary_bg_color`, `button_color`, `button_text_color`) onto CSS custom properties on `<html>`, sets `data-color-scheme`, and subscribes to `themeChanged`.
- Haptics wrapper: `front/shared/lib/telegram/haptic.ts` exposes `haptic('light'|'medium'|'heavy')` and `hapticNotify('success'|'warning'|'error')`.
- Public re-exports: `front/shared/lib/telegram/index.ts`.
- Type surface: `front/shared/types/telegram.d.ts` declares global interfaces `TelegramWebApp`, `TelegramWebAppUser`, `TelegramWebAppThemeParams`, and the `Window.Telegram` augmentation.
- Consumed in UI: `front/views/home/ui/HomeView.tsx` (referenced via grep; not opened in this pass).

**Telegram initData verification (backend):**
- Implementation: `roomies back/src/auth/telegram-init-data.ts`.
  - Computes `secretKey = HMAC_SHA256("WebAppData", botToken)`, then `expectedHash = HMAC_SHA256(secretKey, dataCheckString)` where `dataCheckString` is the sorted `key=value` pairs joined by `\n` (excluding `hash`). Constant-time comparison is **not** used — plain `!==` (`telegram-init-data.ts:54`).
  - Rejects when `hash` is missing, when `auth_date` is missing/non-finite, when initData is older than 24 hours (`DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60`), when `user` is missing, or when `user.id` is not a number. All failures throw `InvalidInitDataError`.
- Endpoint: `POST /auth/telegram` (`roomies back/src/auth/auth.controller.ts:13-20`). Accepts `{ initData: string }` (`roomies back/src/auth/dto/telegram-login.dto.ts`), validated by the global `ValidationPipe`. On success upserts the user in Postgres and returns `{ accessToken, expiresIn, userId, telegramId, isNew }` (`AuthTokensDto`).
- Bot token source: `TELEGRAM_BOT_TOKEN` via `config.getOrThrow` (`roomies back/src/auth/auth.service.ts:23`).
- Result: JWT signed by `@nestjs/jwt` with payload `{ sub: userId, tg: telegramId }`. TTL defaults to 7 days. Verification is centralized in `JwtAuthGuard` (`roomies back/src/auth/jwt-auth.guard.ts`), which extracts a `Bearer` token and attaches `req.user = { id, telegramId: bigint }`.

## Data Storage

**Databases:**
- PostgreSQL — the only datastore. Connected via the Prisma 7 driver-adapter pattern.
  - Client: `roomies back/src/prisma/prisma.service.ts` — `new PrismaPg({ connectionString: process.env.DATABASE_URL })` passed into `new PrismaClient({ adapter })`. The service implements `OnModuleInit` / `OnModuleDestroy` to explicitly call `$connect` / `$disconnect`.
  - Module: `roomies back/src/prisma/prisma.module.ts` — declared `@Global()` and exports `PrismaService`, so any feature module can inject it without re-importing.
  - Schema: `roomies back/prisma/schema.prisma` (~690 lines, ~30 models) — covers users, photos, vibe tags & embeddings, swipes, matches, chats, messages, agreements, squads, reports/blocks, verifications, push tokens, etc. The schema is the canonical source of truth for the data model.
  - `prisma/migrations/` does not exist in the snapshot — no committed migration history; the schema appears to be applied via `prisma db push` (or migrations are not yet committed).
  - `User.telegramId` is `BigInt @unique` — see `BigInt.toJSON` monkey-patch in `roomies back/src/main.ts:7-9`.

**File storage:**
- None. No S3 / R2 / GCS / blob storage SDK is installed. `Verification.externalRef` (schema comment: "Ссылка на внешнее хранилище (напр. S3-ключ для селфи)") and `UserPhoto.url` reserve fields for a future provider but nothing is wired today.

**Caching:**
- None. No Redis / Memcached / `cache-manager` / in-process LRU.

## Authentication & Identity

**Auth provider:**
- Custom — Telegram Mini App `initData` HMAC-verified server-side, exchanged for an internal JWT. See "Telegram initData verification" above.
- Sanity-check endpoint: `GET /auth/me` (`roomies back/src/auth/auth.controller.ts:23-28`), protected by `JwtAuthGuard`, returns `{ id, telegramId }` for the bearer-authenticated user.
- The `@CurrentUser()` parameter decorator (`roomies back/src/auth/current-user.decorator.ts`) is the convention for reading the authenticated user inside controllers.

**Sessions / refresh:**
- No refresh tokens. The access JWT lives 7 days by default. When it expires, the client must re-`POST /auth/telegram` with a fresh `initData` (which itself has a 24-hour validity window).

## Monitoring & Observability

**Error tracking:** None. No Sentry / Bugsnag / Datadog SDK.

**Logs:** Default Nest `Logger` only (Express request logging is not enabled; no Pino / Winston). The frontend uses `console` (no audit performed for stray `console.log` calls).

**Metrics / tracing:** None. `@opentelemetry/*` packages present under `front/node_modules` are transitive dependencies of `next` and are not actively wired.

## CI/CD & Deployment

**Hosting:** Undefined. No `Dockerfile`, `docker-compose.yml`, `vercel.json`, `render.yaml`, `fly.toml`, `Procfile`, or Terraform/Pulumi config in the repo.

**CI pipeline:** None. No `.github/workflows`, no `.gitlab-ci.yml`, no `circleci/`. Lint / test / build are manual.

## Environment Configuration

**Required env vars (backend):**
- `DATABASE_URL` — Postgres connection string (consumed in `roomies back/src/prisma/prisma.service.ts:11`).
- `TELEGRAM_BOT_TOKEN` — `getOrThrow` (`roomies back/src/auth/auth.service.ts:23`).
- `JWT_SECRET` — `getOrThrow` (`roomies back/src/auth/auth.module.ts:14`).

**Optional env vars (backend):**
- `JWT_ACCESS_TTL_SECONDS` — defaults to 604800 (7 days).
- `PORT` — defaults to 3000.

**Required env vars (frontend):** None at present. No `NEXT_PUBLIC_*` variables are referenced in the audited files. When the frontend starts calling the backend, expect at minimum a `NEXT_PUBLIC_API_BASE_URL` (or similar) to be introduced.

**Secrets location:** `roomies back/.env` (existence verified — contents not read). Frontend has no `.env*` file.

## Cloudflare Quick-Tunnel (dev only)

- Script: `front/package.json:10`
  ```text
  "tunnel": "concurrently -k -n next,cf -c blue,magenta \"npm:dev\" \"cloudflared tunnel --url http://localhost:3000\""
  ```
- Mechanism: `cloudflared tunnel --url` (without a named tunnel or auth token) requests an **ephemeral** `*.trycloudflare.com` hostname. Each run produces a new subdomain (e.g. `territory-view-align-linda.trycloudflare.com`, the example called out in the `next.config.ts` comment).
- Why it's needed: the Telegram client requires an HTTPS public URL to load a Mini App. `localhost` is not reachable from the Telegram WebView.
- Next.js 16 cross-origin allow-list: `front/next.config.ts:7` sets `allowedDevOrigins: ['*.trycloudflare.com']`. Without this, Next.js 16 rejects HMR / dev requests originating from non-`localhost` hosts. Wildcard is intentional because the subdomain rotates.
- Lifecycle: ephemeral. The URL dies when the `tunnel` script stops. The bot's Mini App URL in BotFather must be updated each run (operational pain point — see CONCERNS once produced).
- **Not** used in production; there is no `cloudflared` config file (no named tunnel, no `config.yml`).

## Unsplash images

- Used only for mock profile photos. Direct evidence: `front/entities/profile/model/mock-profiles.ts` contains hard-coded `https://images.unsplash.com/photo-*` URLs at lines 15, 28, 41, 54, 67 (and likely more).
- Whitelisted for `next/image` optimisation in `front/next.config.ts:8-15`:
  ```text
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  }
  ```
- No Unsplash API key, no signed requests — these are plain hot-linked CDN URLs intended to be replaced by user-uploaded photos (`UserPhoto.url` in the schema) once an upload pipeline exists.

## Swagger UI

- Mounted at `GET /api` (`roomies back/src/main.ts:30`). Title `"Roomies API"`, version `"1.0"`, bearer auth declared via `.addBearerAuth()`.
- Backed by `@nestjs/swagger` `^11.4.3` and `swagger-ui-express` `^5.0.1`.
- The auth endpoints are decorated (`@ApiTags('auth')`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth` on `/auth/me`) so they show up with full request/response schemas.
- **Not gated** — Swagger is publicly accessible at `/api` even in production unless a guard is added later.

## Webhooks & Callbacks

**Incoming:** None. The bot does not expose a Telegram webhook receiver; auth is pulled from the Mini App `initData` only (no `setWebhook` integration, no `node-telegram-bot-api` / `telegraf` / `grammy` dependency).

**Outgoing:** None. The backend does not currently call any external service (no payment provider, no email sender, no push provider, no Telegram Bot API client).

---

*Integration audit: 2026-05-22*
