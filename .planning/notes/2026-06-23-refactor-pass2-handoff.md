---
date: "2026-06-23 21:55"
promoted: false
---

Frontend refactor PASS 2 — COMPLETE. Tree compiles (tsc clean). Pushed: 9eddf65 + f78615b on master.

DONE in pass 2:
- shared/ui/chip/Chip.tsx — toggle Chip primitive.
- shared/config/profile-display.ts — TAG_COLORS + SCENARIO_LABELS, now wired.
- Button applied: SquadCard, PendingInviteCard — pixel-identical.
- FilterSheet + ProfileEditSheet (ToggleChip) → shared Chip.
- TAG_COLORS deduped in ProfileCard, ProfileView, CandidateProfileSheet.
- SCENARIO_LABELS deduped in ProfileView + CandidateProfileSheet (old BUDGET_SCENARIOS).

DELIBERATELY LEFT (different style — do NOT force into Button):
- Chat-card action buttons (CallInviteCard, AgreementCard) use a FLAT style (active:scale-95, no shadow) — would change visually. Consider a Button `flat`/`ghost` variant if unification wanted.
- DeckToolbar: Filters button is a clean Button-white, but the Boost button is a special stateful toggle (yellow #fff3a0 bg, duration-150, emoji animation) that doesn't fit Button — left the whole toolbar for coherence.
- RoomieScoreCard: no buttons.
- onboarding steps (ScenarioStep/LocationStep/BudgetStep/DealbreakersStep/QuizStep/ProfileStep): not yet reviewed for Button/Chip reuse.
- TextField/Input primitive: still not extracted (input class string repeats in form sheets).

Pre-existing lint debt (not from refactor): react-hooks/set-state-in-effect in ProposeCallSheet + ProfileEditSheet.

Pass 1 was commit 0abed58 (Button/BottomSheet/Loader). Bug fixes were 792adff.
