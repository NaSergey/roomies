---
phase: 05-squad-mode
plan: "03"
subsystem: frontend
tags: [squad, widgets, neobrutalism, react-query, swipe-deck, profile]
dependency_graph:
  requires:
    - "05-02 — useMySquadQuery, useSquadFeedQuery, usePendingInvitesQuery, useCreateSquad, useInviteToSquad, useRespondInvite, useLeaveSquad hooks"
    - "05-01 — SquadModule REST endpoints"
  provides:
    - "front/widgets/squad/ui/SquadCard.tsx — neobrutalism feed card for squad discovery"
    - "front/widgets/squad/ui/PendingInviteCard.tsx — compact accept/decline invite card"
    - "front/widgets/squad/ui/CreateSquadSheet.tsx — bottom sheet to create a squad"
    - "front/widgets/squad/ui/InviteMemberSheet.tsx — match list picker to invite members"
    - "front/widgets/squad/index.ts — FSD widget barrel"
    - "front/widgets/swipe-deck/ui/SwipeDeck.tsx — horizontal squad row below action buttons"
    - "front/widgets/profile/ui/ProfileView.tsx — Мой сквад section with full create/manage/leave flow"
  affects:
    - "Discovery feed (SwipeDeck) — squad cards now appear in a horizontal scroll row"
    - "Profile tab (ProfileView) — squad management section now visible"
tech_stack:
  added: []
  patterns:
    - "client-side dismiss with Set<number> state — squad cards removed without server round-trip"
    - "sentIds Set tracking per-sheet — invite buttons switch to Отправлено after success without query invalidation"
    - "if (!open) return null pattern — sheets unmount when closed (same as CreateSquadSheet and InviteMemberSheet)"
    - "conditional squad UI — mySquad truthy shows manage card, falsy shows create button"
key_files:
  created:
    - "front/widgets/squad/ui/SquadCard.tsx"
    - "front/widgets/squad/ui/PendingInviteCard.tsx"
    - "front/widgets/squad/ui/CreateSquadSheet.tsx"
    - "front/widgets/squad/ui/InviteMemberSheet.tsx"
    - "front/widgets/squad/index.ts"
  modified:
    - "front/widgets/swipe-deck/ui/SwipeDeck.tsx"
    - "front/widgets/profile/ui/ProfileView.tsx"
decisions:
  - "SquadCard uses w-64 shrink-0 in a flex overflow-x-auto container — fixed card width gives consistent horizontal scroll feel without clipping"
  - "InviteMemberSheet uses local sentIds Set — avoids invalidating the invite query (which is recipient-side); sent state is ephemeral per sheet open"
  - "CreateSquadSheet resets form fields on successful close — prevents stale values if user opens sheet again"
  - "if (!open) return null for both sheets — matches plan spec; simpler than CSS translate-y animation since these sheets are secondary UI"
  - "Squad row in SwipeDeck placed after CandidateProfileSheet closing div but before closing outer div — keeps deck JSX clean; squad row is below the deck area"
metrics:
  duration: "~4 min"
  completed: "2026-06-23"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 5 Plan 03: Squad UI Components + SwipeDeck + ProfileView Integration

**One-liner:** Four neobrutalism squad widget components wired into SwipeDeck's horizontal feed row and ProfileView's squad management section, completing the full Phase 5 user-visible squad flow.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create SquadCard, PendingInviteCard, CreateSquadSheet, InviteMemberSheet; export barrel | 976843a | front/widgets/squad/ui/SquadCard.tsx, PendingInviteCard.tsx, CreateSquadSheet.tsx, InviteMemberSheet.tsx, front/widgets/squad/index.ts |
| 2 | Update SwipeDeck and ProfileView | f036f9a | front/widgets/swipe-deck/ui/SwipeDeck.tsx, front/widgets/profile/ui/ProfileView.tsx |

## What Was Built

### front/widgets/squad/ui/SquadCard.tsx
Neobrutalism card (`border-2 border-black`, `shadow-[4px_4px_0_...]`, `bg-[#f0efe9]`) fixed at `w-64 shrink-0` for horizontal scroll. Renders: squad name with 👥 prefix (or "Ищем соседей"), member count badge in `bg-[#a8d8ff]`, budget string or "Бюджет не указан", district chips in `bg-[#c8f36a]` (first 3 + "+N ещё"), up to 4 member avatar circles with letter fallback, "Пропустить" dismiss button.

### front/widgets/squad/ui/PendingInviteCard.tsx
Compact `bg-[#a8d8ff]` card showing squad name, member count, sender name. Two buttons: "Принять" (`bg-[#c8f36a]`) and "Отклонить" (`bg-white`), both calling `useRespondInvite().mutate({ inviteId, action })`. Buttons disabled while mutation is pending.

### front/widgets/squad/ui/CreateSquadSheet.tsx
Slide-up bottom sheet (`fixed inset-x-0 bottom-0 z-50`) with backdrop overlay. Controlled via `open` prop (returns null when closed). Fields: name text input (maxLength 100), budgetMin/budgetMax number inputs. "Создать" calls `useCreateSquad().mutate(...)` with optional fields; resets form and calls `onClose` on success. "Отмена" calls `onClose` directly.

### front/widgets/squad/ui/InviteMemberSheet.tsx
`max-h-[70vh]` scrollable bottom sheet listing matches from `useMatchesQuery()`. Each row shows avatar (Image or letter fallback), partner name, and "Пригласить" button. Button switches to static "Отправлено" text after `inviteMutation` succeeds, tracked in `sentIds: Set<number>` local state. Empty state shown when no matches. Accepts `squadId: number | undefined` — guards against undefined before mutating.

### front/widgets/squad/index.ts
FSD barrel re-exporting all four components.

### SwipeDeck update
Added `useSquadFeedQuery` fetch, `dismissedSquads: Set<number>` state, `visibleSquads` derived array. Squad row (`"Сквады в поиске 👥"` label + `overflow-x-auto flex` container with `SquadCard` per squad) renders below the deck area when `visibleSquads.length > 0`. Dismissing a card adds its id to `dismissedSquads`, hiding it client-side.

### ProfileView update
Added squad hooks (`useMySquadQuery`, `usePendingInvitesQuery`, `useLeaveSquad`) and squad sheet imports. New "МОЙ СКВАД" section after RoomieScoreCard:
- Pending invites list (`PendingInviteCard` per invite) shown above squad info
- If `mySquad`: shows name, `N/max` badge, member name chips, "Пригласить" → `setInviteOpen(true)`, "Выйти" → `leaveSquad.mutate(mySquad.id)`
- If `!mySquad`: "+ Создать сквад" button → `setCreateSquadOpen(true)`
`CreateSquadSheet` and `InviteMemberSheet` rendered as siblings after `ProfileEditSheet`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all components call real React Query hooks from Plan 05-02 which target real backend endpoints from Plan 05-01.

## Threat Flags

None — no new trust boundaries. CreateSquadSheet form fields (name, budgetMin, budgetMax) are passed through to the backend POST /squads endpoint which applies class-validator constraints. No new auth paths or network endpoints introduced in the frontend.

## Self-Check: PASSED

- [x] `front/widgets/squad/ui/SquadCard.tsx` — exists, `'use client'`, exports `SquadCard`
- [x] `front/widgets/squad/ui/PendingInviteCard.tsx` — exists, `'use client'`, exports `PendingInviteCard`
- [x] `front/widgets/squad/ui/CreateSquadSheet.tsx` — exists, `'use client'`, exports `CreateSquadSheet`
- [x] `front/widgets/squad/ui/InviteMemberSheet.tsx` — exists, `'use client'`, exports `InviteMemberSheet`
- [x] `front/widgets/squad/index.ts` — exports all 4 components (verified grep: 4 lines)
- [x] `front/widgets/swipe-deck/ui/SwipeDeck.tsx` — useSquadFeedQuery, SquadCard, dismissedSquads present (6 lines matched)
- [x] `front/widgets/profile/ui/ProfileView.tsx` — useMySquadQuery, usePendingInvitesQuery, createSquadOpen, inviteOpen present (7 lines matched)
- [x] Commit 976843a — verified (Task 1)
- [x] Commit f036f9a — verified (Task 2)
- [x] `npx tsc --noEmit` — exits 0, no errors
