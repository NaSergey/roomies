# Roomie App — Project Guide

## Project Context

Telegram Mini App for roommate matching (18–30 y.o.) based on vibe/lifestyle compatibility.

- **Planning:** `.planning/` — PROJECT.md, ROADMAP.md, REQUIREMENTS.md
- **State:** `.planning/STATE.md` — current phase and progress
- **Architecture:** `.planning/codebase/ARCHITECTURE.md`

## Structure

```
roomies/
├── front/          # Next.js 16, React 19, Tailwind v4, FSD architecture
└── roomies back/   # NestJS 11, Prisma 7, PostgreSQL
```

## GSD Workflow

This project uses GSD (Get Shit Done) for planning and execution.

**Current state:** See `.planning/STATE.md`

**Commands:**
- `/gsd-plan-phase 1` — Plan Phase 1 (Onboarding)
- `/gsd-execute-phase 1` — Execute a planned phase
- `/gsd-progress` — Check current status
- `/gsd-discuss-phase N` — Discuss approach before planning

**Phase order:**
1. Onboarding (ONBOARD-01–07)
2. Matching Engine (MATCH-01–05)
3. Discovery & Profiles (MATCH-06–09, PROF-01–04)
4. Chat & Agreement (CHAT-01–06, AGREE-01–03)
5. Squad Mode (SQUAD-01–04)
6. Trust, Notifications & Feedback (TRUST-01–04, NOTIF-01–04, FEED-01–02)
7. Monetization (MONET-01–02)

## Key Technical Rules

- `telegramId` is always **BigInt** — never cast to number
- `JWT_SECRET` and `TELEGRAM_BOT_TOKEN` must be set in env
- Always verify `initData` via HMAC, never trust `initDataUnsafe`
- Match invariant: `user1Id < user2Id` must be enforced at app layer
- Frontend FSD layers: app → views → widgets → features → entities → shared (top-down only)
- Cross-slice imports only through `index.ts` barrel

## Frontend FSD

Layer order (each may import only from layers below):
- `app/` — routing only
- `views/` — page compositions
- `widgets/` — composite blocks
- `features/` — user actions + state
- `entities/` — domain models (presentational only)
- `shared/` — SDK wrappers, types, utilities
