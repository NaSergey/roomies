# Phase 5: Squad Mode — Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers group search: users can form a squad (2–4 people), invite matches to join, and squad cards appear in the discovery feed showing combined budget and districts.

After this phase:
- User can create a squad from their Profile tab — naming it, setting budget + districts (SQUAD-01)
- Squad leader can invite users from their match list (SQUAD-02)
- Invited user sees pending invites in Profile tab and can accept/decline (SQUAD-03)
- Squad cards appear in the SwipeDeck feed so solo users can browse active squads (SQUAD-04)

What is NOT in Phase 5: swiping/matching on squad cards (Phase 6+), chat between squad seekers and squads (future), squad dissolve (future).
</domain>

<decisions>
## Implementation Decisions

### Squad Management Location
- **D-01 LOCKED:** Squad management lives in the **Profile tab** (`widgets/profile/ProfileView`). No new BottomNav tab. Add a "Мой сквад" card section below the existing profile content. The section shows: current squad info (if any) OR a "Создать сквад" button (if not in a squad). Also shows "Приглашения в сквад" if there are pending invites.

### Invites
- **D-02 LOCKED:** Squad leaders invite members **from their match list** (GET /matches endpoint already built in Phase 4). No username search needed. The invite sheet shows the match list — tapping a match sends a squad invite.
- **D-03 LOCKED:** Invite flow: sender taps "Пригласить" → InviteMemberSheet shows matches → select user → POST /squads/:id/invites. Recipient sees pending invites section in ProfileView → "Принять" / "Отклонить".

### Squad Feed Cards (SQUAD-04)
- **D-04 LOCKED:** Squad cards come from a **separate backend endpoint** `GET /squads/feed`. Frontend fetches both `/feed` (user cards) and `/squads/feed` (squad cards) independently. SwipeDeck interleaves: show 1 squad card every 5 user cards, appended at the end of each feed page. If no squads, the feed is unchanged.
- **D-05 LOCKED:** Squad cards in the SwipeDeck are **informational (read-only)**. No swipe-like/match action — the card has a "Пропустить" (skip) button that removes it from view client-side. No POST /swipes for squads.
- **D-06 LOCKED:** `GET /squads/feed` returns squads where: isActive=true, user is not a member, city matches user's city (if set), member count < maxMembers.

### Squad Card Shape (SQUAD-04)
Squad feed card shows:
- Squad name (or "Без названия" if null)
- Member count (e.g., "2/4 участника")
- Combined budget range: min(member budgets) – max(member budgets)
- Districts: union of all member preferred districts

### Leaving/Dissolving
- **D-07 LOCKED:** Any member can leave a squad (`DELETE /squads/:id/members/me`). If the leader leaves, the squad is deactivated (`isActive = false`). Transfer of leadership is not in Phase 5 scope.

### Squad size constraint
- **D-08 LOCKED:** Max 4 members (matches `Squad.maxMembers` default). Creating a squad while already in one returns 400 BadRequest. Inviting when squad is full returns 400 BadRequest.

### Claude's Discretion
- Exact visual design of SquadCard in SwipeDeck (use same neobrutalism card style as ProfileCard)
- Whether "Создать сквад" uses a bottom sheet or an inline form within ProfileView
- Whether squad card in ProfileView shows a member list inline or in a sheet
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Data
- `roomies back/prisma/schema.prisma` — Squad, SquadMember, SquadDistrict, SquadInvite, SquadRole, SquadInviteStatus models
- `roomies back/src/chat/chat.service.ts` — assertParticipant pattern (replicate for squad access guard)
- `roomies back/src/swipe/swipe.service.ts` — current match creation (for invite from matches: GET /matches is already available)

### Existing Backend Patterns
- `roomies back/src/chat/chat.module.ts` — module pattern (imports: [AuthModule, PrismaModule])
- `roomies back/src/chat/chat.controller.ts` — controller pattern with ParseIntPipe, JwtAuthGuard
- `roomies back/src/app.module.ts` — register SquadModule here

### Existing Frontend Patterns
- `front/widgets/profile/ui/ProfileView.tsx` — add "Мой сквад" section here
- `front/widgets/profile/ui/ProfileEditSheet.tsx` — bottom sheet pattern reference
- `front/widgets/swipe-deck/ui/SwipeDeck.tsx` — deck to update for squad card interleaving
- `front/entities/profile/ui/ProfileCard.tsx` — card pattern to mirror for SquadCard
- `front/shared/lib/api/chat.ts` — API module pattern (types + apiFetch functions)
- `front/features/chat/model/use-chat.ts` — React Query hooks pattern
- `front/shared/lib/api/index.ts` — add squad.ts exports here

### Requirements
- `REQUIREMENTS.md` — SQUAD-01, SQUAD-02, SQUAD-03, SQUAD-04
- `CLAUDE.md` — FSD layer rules, BigInt rules

</canonical_refs>

<code_context>
## Existing Code Insights

### What's Already Built
- All DB models (Squad, SquadMember, SquadDistrict, SquadInvite) exist in schema — **no migrations needed**
- GET /matches (Phase 4) returns matches with partner info — reuse this data for the invite member picker
- ProfileView in `front/widgets/profile/ui/ProfileView.tsx` — add section below existing content
- SwipeDeck in `front/widgets/swipe-deck/ui/SwipeDeck.tsx` — extend with squad card interleaving
- `apiFetch` from `shared/lib/api/client.ts` handles auth tokens

### Integration Points
- `roomies back/src/app.module.ts` → import SquadModule
- `front/widgets/profile/ui/ProfileView.tsx` → add "Мой сквад" section
- `front/widgets/swipe-deck/ui/SwipeDeck.tsx` → interleave squad cards every 5th position
- `front/shared/lib/api/index.ts` → add squad.ts exports
</code_context>

<specifics>
## Specific Ideas

### Squad creation flow
1. User in ProfileView → taps "Создать сквад" button
2. CreateSquadSheet slides up: name field (optional), budgetMin/Max inputs, district multiselect (reuse existing geo API)
3. Confirm → POST /squads → squad created, user becomes leader
4. ProfileView section refreshes showing squad card

### Invite flow
1. Leader in ProfileView squad section → taps "Пригласить участника"
2. InviteMemberSheet shows match list (useMatchesQuery from Phase 4)
3. Tap a match → POST /squads/:id/invites → success toast
4. Already-invited users are greyed out

### Squad card in feed (SwipeDeck)
- Card looks like a neobrutalism card with "👥 [Squad name]" header
- Shows: "2/4 участника", budget range, districts list
- Footer: "Пропустить" button (client-side dismiss only)

### Pending invites in ProfileView
- If `pendingInvites.length > 0`: show a compact invite card list above "Мой сквад"
- Each invite: "Вас приглашают в сквад [squad name] ([N] участников)" + "Принять" / "Отклонить"
</specifics>

<deferred>
## Deferred

- **Squad chat** — Squad members chatting together (not 1:1 match chat) — future
- **Squad dissolve** — Leader-initiated full squad dissolution — future
- **Squad leader transfer** — future
- **Swipe/match on squad cards** — SQUAD-04 only says "appears in feed", no match mechanic specified
- **Squad visibility settings** — always public (isActive=true) in Phase 5
</deferred>

---

*Phase: 05-squad-mode*
*Context gathered: 2026-06-23*
