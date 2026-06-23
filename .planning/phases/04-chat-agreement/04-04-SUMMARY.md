---
phase: 04-chat-agreement
plan: "04"
subsystem: frontend
tags: [chat, call-invite, agreement, bottom-sheet, react-query, tailwind, neobrutalism]
dependency_graph:
  requires:
    - 04-02 (chat API layer — useProposeCall, useRespondCall, useCreateAgreement, useRespondAgreement, useCallInvitesQuery, useAgreementsQuery)
    - 04-03 (ChatConversation with callInviteSlot/agreementSlot props, ChatView with stub handlers)
  provides:
    - front/widgets/chat/ui/CallInviteCard.tsx — interactive call invite card with per-slot accept, proposer read-only, accepted/declined states
    - front/widgets/chat/ui/ProposeCallSheet.tsx — bottom sheet with 1–3 datetime-local inputs and propose button
    - front/widgets/chat/ui/AgreementCard.tsx — agreement card listing 5 items with accept/decline for recipient
    - front/widgets/chat/ui/AgreementSheet.tsx — bottom sheet previewing 5 standard items and triggering createAgreement
  affects:
    - front/widgets/chat/ui/ChatView.tsx (wired real slot functions, sheet state, ProposeCallSheet + AgreementSheet rendered)
tech_stack:
  added: []
  patterns:
    - Bottom sheet slide-up pattern (overlay + translate-y-full/translate-y-0) from FilterSheet
    - Slot-prop pattern (callInviteSlot/agreementSlot functions) — ChatView builds lookup maps, passes renderers to ChatConversation
    - Hooks-at-top-level rule — useCallInvitesQuery/useAgreementsQuery called unconditionally with chatId=0 fallback when no chat selected
    - Intl.DateTimeFormat('ru-RU') for Russian locale datetime formatting
    - T-04-15/T-04-16 threat mitigations via currentUserId !== proposerId/createdById guards
key_files:
  created:
    - front/widgets/chat/ui/CallInviteCard.tsx
    - front/widgets/chat/ui/ProposeCallSheet.tsx
    - front/widgets/chat/ui/AgreementCard.tsx
    - front/widgets/chat/ui/AgreementSheet.tsx
  modified:
    - front/widgets/chat/ui/ChatView.tsx
decisions:
  - "Hooks unconditionally at top level: useCallInvitesQuery(selected?.chatId ?? 0) — chatId=0 results in harmless 403 which React Query catches silently; avoids conditional hook violation"
  - "ProposeCallSheet slot reset via useEffect watching open=false — clean state each time sheet opens"
  - "CallInviteCard shows per-slot Принять button only to recipient (currentUserId !== invite.proposerId) per T-04-15"
  - "AgreementCard shows Принять/Отклонить only to recipient (currentUserId !== agreement.createdById) per T-04-16"
  - "ChatView renders ProposeCallSheet/AgreementSheet inside the selected branch (still Fragment-wrapped alongside ChatConversation) to keep chatId non-null"
metrics:
  duration: "~12 minutes"
  completed: "2026-06-23"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 4 Plan 04: CallInviteCard + ProposeCallSheet + AgreementCard + AgreementSheet Summary

**One-liner:** Four interactive chat components — in-thread call invite card with per-slot accept buttons, datetime-picker bottom sheet for proposing calls, agreement card with 5 items and accept/decline, and agreement initiation sheet — all wired into ChatView via lookup-map slot functions.

## What Was Built

### Task 1: CallInviteCard, ProposeCallSheet, AgreementCard, AgreementSheet

**CallInviteCard** (`front/widgets/chat/ui/CallInviteCard.tsx`):
- Props: `invite: CallInviteData`, `currentUserId: number`, `chatId: number`, `onProposeNew: () => void`
- Recipient view (pending): each proposed time as a row with "Принять" button → `useRespondCall.mutate({ inviteId, action: 'accept', confirmedTime: time })`; "Предложить другое время" link calls `onProposeNew`
- Proposer view (pending): times listed read-only + "Ожидаем ответа..."
- Accepted: green "✓ Подтверждено: [formatted time]"
- Declined/expired: greyed card (opacity-50) + "Отклонено"
- Datetime formatted with `Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })`
- Neobrutalism card: `rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0_...]`

**ProposeCallSheet** (`front/widgets/chat/ui/ProposeCallSheet.tsx`):
- Props: `open: boolean`, `onClose: () => void`, `chatId: number`
- State: `slots: string[]` starting as `['']`
- `<input type="datetime-local" />` per slot with `min={new Date().toISOString().slice(0,16)}`
- "＋ Добавить слот" (hidden when 3 slots already, max 3 per D-06)
- "Предложить" button → filters empty slots → `useProposeCall.mutate(validTimes)` → `onClose` on success
- `useEffect` resets slots to `['']` when `open` becomes false
- Overlay + slide-up pattern from FilterSheet

**AgreementCard** (`front/widgets/chat/ui/AgreementCard.tsx`):
- Props: `agreement: AgreementData`, `currentUserId: number`, `chatId: number`
- Lists `agreement.items` with "•" bullets
- Recipient (draft): "Принять" (accent) + "Отклонить" (white/muted) buttons → `useRespondAgreement.mutate`
- Initiator (draft): "Ожидаем ответа партнёра..."
- Accepted: green "✓ Принято [date]" using `Intl.DateTimeFormat('ru-RU', { day, month: 'long' })`
- Declined: "Отклонено" italic muted

**AgreementSheet** (`front/widgets/chat/ui/AgreementSheet.tsx`):
- Props: `open: boolean`, `onClose: () => void`, `chatId: number`
- Title "Roomie Agreement" + subtitle about standard rules
- Previews all 5 `AGREEMENT_ITEMS_DISPLAY` items (matching D-08 backend constants)
- "Предложить соглашение" → `useCreateAgreement.mutate(undefined)` → `onClose` on success
- Same bottom sheet pattern as ProposeCallSheet

### Task 2: Wire cards into ChatConversation and sheets into ChatView

**ChatView** (`front/widgets/chat/ui/ChatView.tsx`):
- Added `useState`: `showProposeCall`, `showAgreement`
- Unconditional hook calls: `useCallInvitesQuery(selected?.chatId ?? 0)`, `useAgreementsQuery(selected?.chatId ?? 0)`
- Lookup maps: `callInvitesById: Record<number, CallInviteData>` and `agreementsById: Record<number, AgreementData>`
- Real `callInviteSlot` function: looks up `callInvitesById[inviteId]` → renders `<CallInviteCard>` with `onProposeNew={() => setShowProposeCall(true)}`
- Real `agreementSlot` function: looks up `agreementsById[agreementId]` → renders `<AgreementCard>`
- `onOpenProposeCall={() => setShowProposeCall(true)}`, `onOpenAgreement={() => setShowAgreement(true)}`
- `<ProposeCallSheet>` and `<AgreementSheet>` rendered in selected branch (Fragment-wrapped alongside ChatConversation)
- `useEffect([selected])` resets both sheet states to false when navigating back to MatchList

**ChatConversation** (`front/widgets/chat/ui/ChatConversation.tsx`): No changes needed — slot props already flowed correctly from 04-03 (`callInviteSlot?.(inviteId)` and `agreementSlot?.(agreementId)` passed to MessageBubble).

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

- T-04-14: ProposeCallSheet filters empty strings before sending; backend validates ISO8601 per slot
- T-04-15: `currentUserId !== invite.proposerId` gates Принять buttons in CallInviteCard — proposer sees read-only view
- T-04-16: `currentUserId !== agreement.createdById` gates Принять/Отклонить in AgreementCard — initiator sees "Ожидаем ответа партнёра..."
- T-04-17: Lookup maps built from authenticated queries; non-participants blocked at API level (403)
- T-04-SC: No new npm packages installed

## Self-Check: PASSED

Files exist:
- `front/widgets/chat/ui/CallInviteCard.tsx`: FOUND
- `front/widgets/chat/ui/ProposeCallSheet.tsx`: FOUND
- `front/widgets/chat/ui/AgreementCard.tsx`: FOUND
- `front/widgets/chat/ui/AgreementSheet.tsx`: FOUND
- `front/widgets/chat/ui/ChatView.tsx`: FOUND (updated)

TypeScript: `npx tsc --noEmit` exits clean (no output = no errors) — verified twice (after Task 1 and Task 2)

Key checks:
- CallInviteCard checks `currentUserId !== invite.proposerId` (line 30)
- AgreementCard checks `currentUserId !== agreement.createdById` (line 19)
- ProposeCallSheet has `type="datetime-local"` (line 65)
- AgreementSheet has `createMutation` + `useCreateAgreement` (lines 3, 20, 23, 75, 78)
- ChatView imports ProposeCallSheet + AgreementSheet (lines 11–12)
- ChatView passes real `callInviteSlot` and `agreementSlot` functions (lines 63, 75)
- ChatView uses `useCallInvitesQuery` + `useAgreementsQuery` (lines 5, 30–31)

Commits:
- 33ff2b1: feat(04-04): CallInviteCard + ProposeCallSheet + AgreementCard + AgreementSheet
