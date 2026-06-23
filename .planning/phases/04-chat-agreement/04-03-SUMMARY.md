---
phase: 04-chat-agreement
plan: "03"
subsystem: frontend
tags: [chat, ui, react, tailwind, telegram, react-query, frontend]
dependency_graph:
  requires:
    - 04-02 (chat API layer — useMatchesQuery, useChatMessagesQuery, useSendMessage, useMarkChatRead)
  provides:
    - front/widgets/chat/ui/MatchList.tsx — match list with loading/empty states, row tap → onSelect
    - front/widgets/chat/ui/MessageBubble.tsx — single message renderer (text/system/call_invite)
    - front/widgets/chat/ui/SmartChips.tsx — 5 starter chips (empty chat only)
    - front/widgets/chat/ui/ChatConversation.tsx — full conversation view with polling, nudge, input area
    - front/widgets/chat/ui/ChatView.tsx — local state router: null→MatchList, selected→ChatConversation
  affects:
    - front/widgets/chat/index.ts (ChatView export preserved)
    - front/widgets/home/ui/HomeView.tsx (consumes ChatView via tab=chat — unchanged)
tech_stack:
  added: []
  patterns:
    - Local state navigation (useState<SelectedChat|null>) per D-04: no Next.js route changes
    - Telegram BackButton show/hide/onClick/offClick in useEffect cleanup pair
    - useChatMessagesQuery with built-in 3s refetchInterval (D-02 HTTP polling)
    - Auto-scroll via scrollTop = scrollHeight in useEffect watching messages.length
    - Nudge bar: frontend-only 12h staleness check on messages[0].createdAt (D-11)
    - Message display: backend returns newest-first → reverse for chronological rendering
key_files:
  created:
    - front/widgets/chat/ui/MatchList.tsx
    - front/widgets/chat/ui/MessageBubble.tsx
    - front/widgets/chat/ui/SmartChips.tsx
    - front/widgets/chat/ui/ChatConversation.tsx
  modified:
    - front/widgets/chat/ui/ChatView.tsx
decisions:
  - "MatchList time format: today→HH:mm, yesterday→вчера, older→D MMM using Date.toLocaleString — no lib needed"
  - "MessageBubble uses var(--card,#f5f5f0) fallback for partner bubble bg (--card not in CSS tokens; fallback ensures readable)"
  - "ChatConversation suppresses markReadMutation dep-array exhaustive warning with eslint-disable comment — mutation ref is stable"
  - "callInviteSlot and agreementSlot props typed as undefined in ChatView (04-04 wires actual slots)"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-23"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 4 Plan 03: ChatView — MatchList + ChatConversation + SmartChips + Nudge Bar Summary

**One-liner:** Five-component chat UI replacing the stub: match list with unread badges, per-type message bubbles, 5 smart-chip starters, 3-second-polled conversation view with 12h nudge bar and Telegram BackButton wiring.

## What Was Built

### Task 1: MatchList.tsx, MessageBubble.tsx, SmartChips.tsx

**MatchList** (`front/widgets/chat/ui/MatchList.tsx`):
- Calls `useMatchesQuery()` — shows 3 animated skeleton rows while `isPending`
- Empty state: 💬 + "Здесь появятся переписки с мэтчами."
- Match rows: 48px circular avatar (photo or initial letter fallback), partner name + time, last-message preview (truncated), unread badge (red circle, capped at 99+)
- Time format: today → `HH:mm`, yesterday → `вчера`, older → locale date string
- Last-message preview: `call_invite` → "📞 Предложение созвониться", `system` → "🤝 Соглашение", text → content
- `onSelect(chatId, partnerId, partnerName, partnerPhoto)` callback on row tap

**MessageBubble** (`front/widgets/chat/ui/MessageBubble.tsx`):
- `text` (default): right-aligned accent bg for own, left-aligned card bg for partner, timestamp below
- `system`: centered gray italic span; if `metadata.agreementId` present and `agreementSlot` provided, renders slot instead
- `call_invite`: centered card area; renders `callInviteSlot` if provided, else "📞 Созвон" placeholder (04-04 wires real CallInviteCard)

**SmartChips** (`front/widgets/chat/ui/SmartChips.tsx`):
- 5 tappable chips per D-10: "Как у тебя с гостями?", "Тишина после 23:00?", "Как насчёт питомцев?", "Работаешь из дома?", "Какой у тебя режим сна?"
- `onChipTap(text)` → `sendMutation.mutate(text)` in ChatConversation
- Pill-style neobrutalism chips (border-2 border-black, bg-white, rounded-full)

### Task 2: ChatConversation.tsx + ChatView.tsx replacement

**ChatConversation** (`front/widgets/chat/ui/ChatConversation.tsx`):
- Props: `chatId`, `partnerId`, `partnerName`, `partnerPhoto`, `currentUserId`, `onBack`, `onOpenProposeCall`, `onOpenAgreement`, `callInviteSlot?`, `agreementSlot?`
- Polling: `useChatMessagesQuery(chatId)` — refetchInterval 3000ms built into hook (D-02)
- `useMarkChatRead(chatId).mutate()` called once on mount via `useEffect([chatId])`
- BackButton: `show` + `onClick(handler)` on mount, `offClick(handler)` + `hide` on unmount
- Auto-scroll: `scrollTop = scrollHeight` on message container ref, triggered on `messages.length` change
- Display order: `[...messages].reverse()` — backend sends newest-first, display chronologically
- Nudge bar (D-11): `messages.length > 0 && Date.now() - new Date(messages[0].createdAt).getTime() > 12 * 60 * 60 * 1000`; "Напомнить" sends hardcoded nudge text
- SmartChips shown when `messages.length === 0`
- Input area: 📞 (`onOpenProposeCall`), 🤝 (`onOpenAgreement`), text field (Enter to send), → send button
- `callInviteSlot` and `agreementSlot` passed through to MessageBubble per message metadata IDs

**ChatView** (`front/widgets/chat/ui/ChatView.tsx`):
- `useState<SelectedChat | null>(null)` — null → MatchList, set → ChatConversation (D-04)
- `useProfileQuery()` provides `currentUserId` for `isOwn` detection in MessageBubble
- No Next.js route changes (D-05)
- `front/widgets/chat/index.ts` barrel unchanged — still `export { ChatView }`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `callInviteSlot` in ChatView passes `undefined` — 04-04 will wire `CallInviteCard`
- `agreementSlot` in ChatView passes `undefined` — 04-04 will wire `AgreementCard`
- `onOpenProposeCall` and `onOpenAgreement` are no-op arrow functions — 04-04 wires ProposeCallSheet and AgreementSheet

These stubs are intentional per plan spec ("04-04 wires these") and do not prevent the plan's goal (functional text messaging) from being achieved.

## Threat Model Coverage

- T-04-11: User message input → `sendMutation.mutate(text)` — no frontend length cap; backend `@MaxLength(2000)` is the authoritative gate (accepted per threat register)
- T-04-12: `useProfileQuery()` returns own profile only (GET /profile/me via JWT sub) — no disclosure risk
- T-04-13: `metadata.callInviteId as number` — if backend sends wrong type, `callInviteSlot?.(...)` returns `undefined`; MessageBubble renders placeholder gracefully, no crash
- T-04-SC: No new npm packages installed

## Self-Check: PASSED

Files exist:
- `front/widgets/chat/ui/MatchList.tsx`: FOUND
- `front/widgets/chat/ui/MessageBubble.tsx`: FOUND
- `front/widgets/chat/ui/SmartChips.tsx`: FOUND
- `front/widgets/chat/ui/ChatConversation.tsx`: FOUND
- `front/widgets/chat/ui/ChatView.tsx`: FOUND (replaced stub, keeps `export function ChatView()`)
- `front/widgets/chat/index.ts`: FOUND (still exports `ChatView`)

TypeScript: `npx tsc --noEmit` exits clean (no output = no errors)

BackButton wiring: show/hide/onClick/offClick present in ChatConversation.tsx (lines 45–54)
useChatMessagesQuery: imported and called in ChatConversation.tsx (line 38)
markReadMutation: called on mount in useEffect (line 59)
SmartChips: rendered when messages.length === 0 (line 121)
showNudge: computed with 12 * 60 * 60 * 1000 threshold (lines 72–74)
ChatView barrel: `export { ChatView } from './ui/ChatView'` (index.ts line 1)

Commits:
- df4a7cc: feat(04-03): ChatView — MatchList + ChatConversation + SmartChips + nudge bar
