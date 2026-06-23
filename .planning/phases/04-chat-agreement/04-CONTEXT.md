# Phase 4: Chat & Agreement — Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers end-to-end chat between matched users — from the matches list to sending messages, scheduling a call, and negotiating house rules via Roomie Agreement.

After this phase:
- The Chat tab shows a real match list with last message and unread count (CHAT-01)
- Tapping a match opens a conversation view with message history (CHAT-03)
- Empty chats show smart-chip starter questions (CHAT-02)
- Users can send text messages (CHAT-03)
- A call invite can be proposed with a datetime picker (up to 3 slots) and accepted/counter-proposed by the recipient (CHAT-04, CHAT-05)
- A soft nudge appears when a chat is silent for 12+ hours (CHAT-06)
- A Roomie Agreement with 5 standard items can be initiated and accepted/declined (AGREE-01, AGREE-02, AGREE-03)

What is NOT in Phase 4: push notifications (Phase 6), post-match feedback (Phase 6), voice messages (v2), message editing/deletion.
</domain>

<decisions>
## Implementation Decisions

### Chat Infrastructure
- **D-01 LOCKED:** Chat records are auto-created by SwipeService when a mutual match is created. Add `chat: { create: {} }` nested write inside the `tx.match.upsert` create block in `swipe.service.ts`.
- **D-02 LOCKED:** Message delivery uses **HTTP polling** — `useChatMessagesQuery` refetches every 3 seconds when the conversation view is mounted. No WebSocket/SSE.
- **D-03 LOCKED:** Messages are paginated by cursor (message `BigInt` id). Default page size: 30 messages, newest first. Older messages load via `?before=<oldest_id>`.

### Chat Navigation (Frontend)
- **D-04 LOCKED:** The Chat tab (`widgets/chat`) uses **local state navigation**: `selectedChatId: number | null`. When `null` → shows MatchList. When set → shows ChatConversation. Telegram BackButton activates while in a conversation view.
- **D-05 LOCKED:** No Next.js route changes. Existing `/` route and tab switching remain untouched.

### Call Invite (CHAT-04, CHAT-05)
- **D-06 LOCKED:** Proposer opens a ProposeCallSheet with a **native `<input type="datetime-local">` picker** and can add 1–3 slots. On confirm, `POST /chats/:chatId/call-invites` creates a `CallInvite` row + a `call_invite` type `Message` in the chat.
- **D-07 LOCKED:** Recipient sees a **CallInviteCard** in the message thread with the proposed times. They tap "Принять" on one slot (PATCH → `{ action: 'accept', confirmedTime }`) or "Предложить другое время" (opens ProposeCallSheet, creates a new CallInvite). Declined/expired invite shows greyed card.

### Agreement (AGREE-01, AGREE-02, AGREE-03)
- **D-08 LOCKED:** Backend creates `RoomieAgreement` with 5 pre-defined `AgreementItem`s and one `system` type `Message`. No per-item editing in MVP. Standard items:
  1. `quiet` — "Тишина после 23:00"
  2. `cleaning` — "Уборка по очереди раз в неделю"
  3. `guests` — "Гости предупреждают за сутки"
  4. `utilities` — "Коммуналка делится поровну"
  5. `shared_zones` — "Кухня и ванная — убираем за собой"
- **D-09 LOCKED:** Recipient sees an **AgreementCard** in the thread showing all 5 items. They tap "Принять" or "Отклонить". Status is stored on `RoomieAgreement.status`.

### Smart Chips (CHAT-02)
- **D-10 LOCKED:** When a chat has 0 messages, show 5 tappable starter chips below the empty state:
  - "Как у тебя с гостями?"
  - "Тишина после 23:00?"
  - "Как насчёт питомцев?"
  - "Работаешь из дома?"
  - "Какой у тебя режим сна?"
  Tapping a chip sends that text as a regular message. Chips disappear once a message exists.

### Nudge (CHAT-06)
- **D-11 LOCKED:** Frontend-only. After messages load: if there is at least 1 message AND the most recent is older than 12 hours → show a nudge bar: "Хочешь аккуратно напомнить [name]?" with a "Напомнить" button. Tapping sends `POST /chats/:chatId/messages` with content `"Привет! Интересно, как дела 🙂"`.

### API Authorization
- **D-12 LOCKED:** All chat endpoints verify the requesting user is a participant (Match.user1Id or Match.user2Id). Non-participants receive 403 Forbidden.

### Claude's Discretion
- Exact layout of CallInviteCard and AgreementCard inside the message thread
- Whether "Предложить созвон" and "Начать соглашение" are icon buttons in the input toolbar or triggered via a "+" menu
- Exact unread count badge styling
- Whether match score % shows in the MatchList row
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these files before planning or implementing.**

### Schema & Data
- `roomies back/prisma/schema.prisma` — Chat, Message, ChatRead, CallInvite, RoomieAgreement, AgreementItem, Match models. Note: `Message.id` is `BigInt`.
- `roomies back/src/swipe/swipe.service.ts` — Match creation transaction to extend with Chat auto-creation

### Existing Backend Patterns
- `roomies back/src/auth/jwt-auth.guard.ts` — JwtAuthGuard + @CurrentUser() decorator
- `roomies back/src/profile/profile.controller.ts` + `profile.service.ts` — REST module pattern
- `roomies back/src/feed/feed.module.ts` — module with `imports: [AuthModule]`
- `roomies back/src/main.ts` — BigInt.toJSON already patched globally (serializes as string)

### Existing Frontend Patterns
- `front/widgets/home/ui/HomeView.tsx` — tab state switching pattern
- `front/widgets/chat/ui/ChatView.tsx` — current stub to replace (keep export name `ChatView`)
- `front/shared/lib/api/index.ts` — API barrel (add chat exports here)
- `front/features/swipe-profile/model/` — React Query hooks pattern
- `front/shared/lib/query/` — QueryClient setup (refetchInterval pattern)
- `front/shared/lib/telegram/index.ts` — Telegram SDK (BackButton pattern)

### Requirements
- `REQUIREMENTS.md` — CHAT-01..06, AGREE-01..03
- `CLAUDE.md` — Message.id is BigInt, FSD layer rules, match invariant user1Id < user2Id

</canonical_refs>

<code_context>
## Existing Code Insights

### What's Already Built
- All DB models for Chat, Message, CallInvite, RoomieAgreement etc. exist in Prisma schema — **no migrations needed**
- `SwipeService.createSwipe()` — extend the `tx.match.upsert` create block with `chat: { create: {} }`
- `ChatView` stub at `widgets/chat/ui/ChatView.tsx` — replace body, keep `export function ChatView()`
- React Query QueryClient already configured in `shared/lib/query/`
- `apiFetch` from `shared/lib/api/client.ts` — use for all API calls (handles auth token)
- `BottomNav` tab navigation pattern already works

### Key Technical Notes
- `Message.id` is `BigInt` — serializes as string from backend (main.ts patches BigInt.toJSON). Frontend uses `string` type for message ids.
- Cursor pagination: `GET /chats/:chatId/messages?limit=30&before=<BigInt_string_cursor>` — Prisma `where: { id: { lt: BigInt(cursor) } }` when cursor is provided.
- Chat access guard: find Match by `chat.matchId` where `user1Id = me OR user2Id = me`.
- `CallInvite.proposedTimes` is `Json` (stored as ISO string array). Frontend type: `string[]`.
- `AgreementItem.agreed` is not used for overall accept/decline; use `RoomieAgreement.status`.
- `ChatRead` upsert on `(chatId, userId)` composite primary key — use `updateMany` or `upsert`.

### Integration Points
- `roomies back/src/swipe/swipe.service.ts` → add `chat: { create: {} }` to match.upsert create data
- `roomies back/src/app.module.ts` → import ChatModule
- `front/widgets/chat/ui/ChatView.tsx` → replace stub with MatchList + ChatConversation state machine
- `front/shared/lib/api/index.ts` → re-export chat.ts API functions
</code_context>

<specifics>
## Specific Ideas

### MatchList Row
- Circular avatar (first photo or placeholder), partner name
- Last message text (truncated, 1 line), relative time ("14:32", "вчера")
- Unread count badge (red circle with number, only if > 0)

### Message Bubble Layout
- Own messages: right-aligned, accent-colored background
- Their messages: left-aligned, --card background
- Timestamp below each bubble, small muted text
- `system` type: centered, gray italic text
- `call_invite` type: full-width card (see CallInviteCard)

### CallInviteCard
- Header: "📞 Предложение созвониться" 
- Proposed times as selectable rows (greyed if invite resolved)
- Pending + recipient: "Принять" button per slot + "Предложить другое время" link
- Accepted: shows confirmed time + "✓ Принято"
- Declined/expired: greyed out card

### AgreementCard
- Header: "🤝 Соглашение соседа"
- List of 5 items with bullet points
- Pending + recipient: "Принять" and "Отклонить" buttons
- Accepted: "✓ Принято [date]"
- Declined: "Отклонено"
</specifics>

<deferred>
## Deferred

- **Voice messages** (ADV-01) — schema has `MessageType.voice` but not wired
- **Push notifications** (NOTIF-02, NOTIF-03) — Phase 6
- **Post-match feedback** (FEED-01, FEED-02) — Phase 6
- **Per-message read receipts** — ChatRead is at conversation level only
- **Message editing / deletion** — editedAt/deletedAt exist but not wired
- **Counter-propose call** — creates a new CallInvite (simple implementation; no special routing needed)
</deferred>

---

*Phase: 04-chat-agreement*
*Context gathered: 2026-06-23*
