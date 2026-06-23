---
date: "2026-06-23 21:40"
promoted: false
---

Frontend refactor (DRY) — extracted shared UI primitives. Commit 0abed58 on master.

Done:
- shared/ui/button — Button (accent/white variants over the shared neobrutalist border + hard-shadow + press base). The `border-2 border-black` button string was duplicated 78× across 20+ files.
- shared/ui/bottom-sheet — BottomSheet (backdrop + slide-up panel + handle). 7 sheets had diverged on z-index/bg/animation; canonical = animated white panel.
- shared/ui/loader — Loader (3 bouncing dots), was inlined in HomeView/ProfileView/SwipeDeck.
- Migrated: Loader (3 views); BottomSheet+Button (CreateSquadSheet, ProfileEditSheet, ProposeCallSheet, AgreementSheet, FilterSheet); Button (ProfileView CTAs). Net −14 lines, typecheck clean.
- Colors were token-identical (bg-[#c8f36a]==bg-accent, text-[#14140f]==text-(--text)); only minor drift standardized (shadow 3px→2px, press effect).

Remaining follow-ups (not done — left for a next pass):
- Button not yet applied to: DeckToolbar, SquadCard, PendingInviteCard, RoomieScoreCard, CallInviteCard, AgreementCard, MatchList, onboarding steps (still inline neo-button class strings).
- BottomSheet not applied to CandidateProfileSheet (custom drag-dismiss + header/scroll/footer) and InviteMemberSheet (header + scrollable list) — specialized layouts, intentionally left.
- TextField/Input primitive NOT extracted — input class string still repeats in form sheets (padding/font drift made a clean primitive awkward; revisit).
- Repeated constants/utils to consolidate: TAG_COLORS (ProfileCard + ProfileView + CandidateProfileSheet vibe tags), SCENARIO_LABELS, calculateAge, formatTime.
- Pre-existing lint debt (not from refactor): react-hooks/set-state-in-effect in ProposeCallSheet (slot reset) and ProfileEditSheet (profile sync).

Process decision: refactor done directly (not a GSD phase) as a single commit per user's request; bug fixes pushed separately first (commit 792adff).
