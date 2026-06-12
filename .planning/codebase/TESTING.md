# Testing Patterns

**Analysis Date:** 2026-05-22

## Current State

**Testing is essentially absent.** The backend has a scaffolded Jest setup with one auto-generated sanity test from the NestJS CLI. The frontend has no test setup, no test runner, no test files. There is no E2E coverage, no UI testing, no Storybook.

Treat any new business code as **first-tests-in-the-codebase** territory — there are no existing patterns to copy from for real logic.

## Backend — `roomies back/`

### Test Framework

- **Runner:** `jest` 30.x (`devDependencies` of `roomies back/package.json`).
- **Transform:** `ts-jest` 29.x.
- **NestJS testing:** `@nestjs/testing` 11.x (`Test.createTestingModule`).
- **HTTP assertions:** `supertest` 7.x + `@types/supertest`.
- **Assertion library:** Jest's built-in `expect`.

### Jest Configuration

**Unit-test config** is inline in `roomies back/package.json` under the `"jest"` key:

```
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

- Picks up `*.spec.ts` files anywhere under `src/`.
- Coverage report writes to `roomies back/coverage/`.

**E2E config** lives in `roomies back/test/jest-e2e.json`:

```
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

- Picks up `*.e2e-spec.ts` files (current location: `roomies back/test/`).

### Run Commands

From `roomies back/`:

```
npm test               # Run all *.spec.ts (unit)
npm run test:watch     # Jest watch mode
npm run test:cov       # Unit tests with coverage
npm run test:debug     # Debug Jest with --inspect-brk
npm run test:e2e       # Run *.e2e-spec.ts via jest-e2e.json
```

### Existing Tests

**Two files exist, both untouched NestJS CLI scaffold output:**

1. **`roomies back/src/app.controller.spec.ts`** — tests `AppController.getHello()` returns `'Hello World!'`. This is the default sanity test from `nest new`. `AppController` still has the placeholder `getHello()` route; both controller and spec should be removed or replaced once real root behavior exists.

2. **`roomies back/test/app.e2e-spec.ts`** — boots the full `AppModule` via supertest, hits `GET /`, expects `200` and body `'Hello World!'`. Will start failing the moment the `GET /` route is replaced or removed.

**Both tests will break** if `AppController.getHello()` is removed without updating them.

### Test Structure Pattern (from scaffold)

For controllers under test, the existing scaffold uses:

```ts
describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
```

For E2E:

```ts
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });
});
```

These are templates only — there are no examples of mocking `PrismaService`, stubbing `ConfigService`, or testing guards/decorators in the repo yet.

### What Is NOT Tested

The backend has **zero tests for any real business code**, including:

- **`verifyTelegramInitData`** (`src/auth/telegram-init-data.ts`) — HMAC verification, `auth_date` expiry, user JSON parsing, all `InvalidInitDataError` branches. This is the security boundary of the entire app and is currently untested.
- **`AuthService.loginWithTelegram`** — initData → user upsert → JWT signing flow.
- **`AuthService.upsertUser`** — display name fallback chain (`first_name + last_name → username → tg_<id>`), update-vs-create branching, default `scenario` value.
- **`JwtAuthGuard.canActivate`** — missing header, malformed header, expired token, invalid token, valid token sets `req.user` with `BigInt` telegramId.
- **`CurrentUser` param decorator** — reads `req.user` correctly.
- **`BigInt.prototype.toJSON` patch** in `main.ts` — confirms responses with `BigInt` serialize as strings.
- **`PrismaService` lifecycle** — connect/disconnect on module init/destroy.

### Patterns to Establish (none exist yet)

When writing the first real tests, decide on:

- **Mocking `PrismaService`**: use a per-test mock object via `Test.createTestingModule({ providers: [{ provide: PrismaService, useValue: mockPrisma }] })`. Do not connect to a real DB from unit tests.
- **Mocking `ConfigService`**: same pattern with `{ provide: ConfigService, useValue: { getOrThrow: jest.fn(...), get: jest.fn(...) } }`.
- **Mocking `JwtService`**: stub `signAsync` / `verifyAsync` directly.
- **Pure helpers (`telegram-init-data.ts`)** should be tested without any Nest module — they import only `node:crypto`. Generate fixtures by computing valid HMAC hashes against a test bot token.
- **Fixture location**: there is no convention yet — recommend `src/**/__fixtures__/*.ts` co-located with the slice that owns the fixture, or `test/fixtures/` for E2E.
- **E2E DB strategy**: not decided. Options are a separate test PG database (`DATABASE_URL` override) or a transactional rollback wrapper. Currently the single E2E test doesn't touch the DB.

## Frontend — `front/`

### Test Framework

**None.** `front/package.json` has no test runner, no test scripts, no test config:

- No `jest`, `vitest`, `@testing-library/*`, `playwright`, or `cypress` in dependencies.
- No `test` script in `scripts` (only `dev`, `build`, `start`, `lint`, `tunnel`).
- No `jest.config.*`, `vitest.config.*`, `playwright.config.*` files.

### Test Files

**Zero.** No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`, `__tests__/` directory, or storybook stories exist anywhere under `front/` (excluding `node_modules/`).

### What Is NOT Tested

Everything. Notable gaps:

- **`useSwipeDeck` hook** (`features/swipe-profile/model/use-swipe-deck.ts`) — visible-window slicing, exit-direction state machine, the `setTimeout`-based advance, reset behavior, haptic call selection (`hapticNotify('success')` vs `haptic('light')`).
- **`SwipeCard` pointer logic** (`features/swipe-profile/ui/SwipeCard.tsx`) — drag start/move/end, `setPointerCapture`, `SWIPE_THRESHOLD` (120px) vs `VELOCITY_THRESHOLD` (500 px/s), spring-back vs commit-to-exit decision, like/nope overlay opacity curves, stack transform composition.
- **`useTelegramWebApp`** (`shared/lib/telegram/use-telegram-web-app.ts`) — SSR safety (`typeof window === 'undefined'`), `ready()`/`expand()` calls, theme-param → CSS-var application, `themeChanged` listener cleanup.
- **`haptic` / `hapticNotify`** — graceful no-op when running outside Telegram (no `window.Telegram`).
- **`ProfileCard`, `ActionButtons`, `EmptyState`, `SwipeDeck`, `HomeView`** — no smoke tests, no snapshot tests, no a11y checks.

### No E2E / UI Testing

- **No Playwright, no Cypress, no Selenium.** The swipe interaction — the entire product experience — has no automated coverage. Manual testing in Telegram via the Cloudflare tunnel (`npm run tunnel`) is the only verification path.
- **No Storybook.** Components cannot be exercised or visually reviewed in isolation.
- **No visual regression**, no Chromatic, no Percy.

### Patterns to Establish (none exist yet)

When introducing frontend tests, decide on:

- **Runner**: Vitest fits Next.js 16 + ESM well; Jest with `next/jest` works too. The codebase has no preference yet.
- **DOM library**: `@testing-library/react` + `@testing-library/user-event` for component tests.
- **Pointer / drag simulation**: `userEvent.pointer` for `SwipeCard`. Real `setPointerCapture` requires JSDOM polyfill or a stub.
- **Telegram SDK mocking**: stub `window.Telegram.WebApp` before render. Provide a test helper in `shared/lib/telegram/__tests__/test-utils.ts`.
- **File colocation**: FSD-friendly choice is `<slice>/<segment>/__tests__/*.test.ts(x)` next to the file under test.
- **E2E**: Playwright is the recommended choice if added — it can drive the Mini App via a desktop browser bypassing Telegram with a mocked `initData`.

## Coverage

**Backend:** `npm run test:cov` produces a report in `roomies back/coverage/`. With only the scaffold test, real coverage is effectively 0% of business logic. No threshold is configured.

**Frontend:** No coverage tooling. No threshold.

## Summary of Gaps (priority order)

1. **`verifyTelegramInitData`** — security boundary, pure function, fastest possible win. Should be the first real test in the repo.
2. **`useSwipeDeck`** and **`SwipeCard` pointer logic** — the product is a swipe deck; the swipe is currently unverified.
3. **`JwtAuthGuard`** — auth boundary, branches matter (missing/malformed/expired/invalid/valid).
4. **`AuthService.loginWithTelegram` + `upsertUser`** — full login flow with a mocked Prisma.
5. **E2E**: at least one happy-path Playwright test that loads the page with a stubbed `Telegram.WebApp` and performs a swipe.
6. **Replace the `AppController` scaffold test + route** with something meaningful (e.g. a `/health` endpoint).

---

*Testing analysis: 2026-05-22*
