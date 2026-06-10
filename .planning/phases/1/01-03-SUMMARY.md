---
phase: 1-onboarding
plan: "01-03"
subsystem: ui
tags: [react, nextjs, tailwind, telegram-webapp, onboarding, fsd]

requires:
  - phase: 01-02
    provides: "Backend OnboardingModule (8 endpoints), GeoModule (2 endpoints), VibeTagsModule"

provides:
  - "OnboardingFlow component — step router for steps 0–3 (Scenario, Location, Budget, Dealbreakers)"
  - "useOnboarding hook — useReducer state machine with mount resume, BackButton side effects"
  - "Step components: ScenarioStep, LocationStep, BudgetStep, DealbreakersStep"
  - "API clients: onboarding-api.ts (7 functions), geo.ts (getCities, getDistricts)"
  - "HomeView gate — renders OnboardingFlow when authenticated+!onboardingCompleted, SwipeDeck otherwise"
  - "types.ts — complete type system for onboarding feature (ScenarioType, OnboardingState, payloads)"

affects:
  - "01-04: will add QuizStep, ProfileStep, DoneStep using same useOnboarding hook and OnboardingFlow container"

tech-stack:
  added: []
  patterns:
    - "useReducer state machine for complex multi-step form flow"
    - "Mount-effect resume pattern with cancellation guard (let cancelled)"
    - "Telegram BackButton wired via useEffect watching step+handleBack"
    - "FSD feature slice: model/ + api/ + ui/ + index.ts barrel"

key-files:
  created:
    - "front/features/onboarding/model/types.ts"
    - "front/features/onboarding/model/use-onboarding.ts"
    - "front/features/onboarding/api/onboarding-api.ts"
    - "front/features/onboarding/ui/OnboardingFlow.tsx"
    - "front/features/onboarding/ui/steps/ScenarioStep.tsx"
    - "front/features/onboarding/ui/steps/LocationStep.tsx"
    - "front/features/onboarding/ui/steps/BudgetStep.tsx"
    - "front/features/onboarding/ui/steps/DealbreakersStep.tsx"
    - "front/features/onboarding/index.ts"
    - "front/shared/lib/api/geo.ts"
  modified:
    - "front/shared/lib/api/index.ts"
    - "front/shared/types/telegram.d.ts"
    - "front/widgets/home/ui/HomeView.tsx"

key-decisions:
  - "OnboardingState includes onboardingCompleted: boolean so OnboardingFlow detects returning users via useEffect"
  - "COMPLETE action sets both step=6 and onboardingCompleted=true in reducer"
  - "HomeView uses early return pattern: if authenticated && !onboardingCompleted -> return <OnboardingFlow> (avoids restructuring main layout)"
  - "BackButton types added to TelegramWebApp interface (Rule 2 — missing critical type definition)"
  - "geo.ts imports from './client' not '@/shared/lib/api' to avoid circular dependency"

patterns-established:
  - "Submit handler pattern: SET_LOADING true → API call → UPDATE_ANSWERS + SET_STEP on success → SET_ERROR on failure → SET_LOADING false in finally"
  - "Cancellation pattern in useEffect: let cancelled = false; return () => { cancelled = true }"
  - "BackButton cleanup: offClick(handleBack) always called in useEffect cleanup return"

requirements-completed:
  - ONBOARD-01
  - ONBOARD-02
  - ONBOARD-03
  - ONBOARD-04

duration: ~40min
completed: 2026-06-10
---

# Phase 1 Plan 03: Frontend Onboarding Steps 0–3 Summary

**useOnboarding state machine hook + 4 step components (Scenario, Location, Budget, Dealbreakers) wired to backend via API clients, HomeView gate active**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-06-10T06:30:00Z
- **Completed:** 2026-06-10T07:13:58Z
- **Tasks:** 2
- **Files modified:** 13 (10 created, 3 modified)

## Accomplishments

- Complete onboarding feature slice (model + api + ui layers) following FSD architecture
- useOnboarding hook with useReducer state machine: mount resume, BackButton side effects, 6 submit handlers
- Step components 0–3 with correct UI per spec: radio cards, city/district select, budget inputs, toggle switches
- HomeView onboarding gate: when auth=authenticated and onboardingCompleted=false, renders full-screen OnboardingFlow
- TypeScript compiles with 0 errors across all new and modified files

## Task Commits

1. **Task 1: Types, API client, useOnboarding hook, geo API** — `db3663d` (feat)
2. **Task 2: Step components 0–3, OnboardingFlow, HomeView gate** — `92591b2` (feat)

## Files Created/Modified

- `front/features/onboarding/model/types.ts` — ScenarioType, GuestsPreference, QuizAnswer, OnboardingAnswers, OnboardingState (with onboardingCompleted), OnboardingAction, OnboardingStatus, payload types
- `front/features/onboarding/model/use-onboarding.ts` — useReducer hook with mount resume, BackButton wiring, submit handlers for all 6 steps
- `front/features/onboarding/api/onboarding-api.ts` — getOnboardingStatus, saveScenario, saveLocation, saveBudget, saveDealbreakers, saveQuiz, saveProfile
- `front/features/onboarding/ui/OnboardingFlow.tsx` — step router with error toast, keyed transition div, onboardingCompleted effect
- `front/features/onboarding/ui/steps/ScenarioStep.tsx` — 4 radio cards with haptic, disabled CTA until selection, aria-checked
- `front/features/onboarding/ui/steps/LocationStep.tsx` — city select, district chips, getCities/getDistricts with cancellation, retry on error
- `front/features/onboarding/ui/steps/BudgetStep.tsx` — min/max number inputs, date + duration selects, inline budget validation
- `front/features/onboarding/ui/steps/DealbreakersStep.tsx` — 3 toggle rows (role=switch), guests sub-selector with max-height animation
- `front/features/onboarding/index.ts` — barrel exports
- `front/shared/lib/api/geo.ts` — getCities, getDistricts importing from ./client (not barrel)
- `front/shared/lib/api/index.ts` — added getCities, getDistricts, City, District exports
- `front/shared/types/telegram.d.ts` — added BackButton type definition
- `front/widgets/home/ui/HomeView.tsx` — added onboardingCompleted state + OnboardingFlow gate

## Decisions Made

- **OnboardingState.onboardingCompleted**: Added as boolean field on state (not just derived from step===6) so that the COMPLETE action can be dispatched by the mount effect (returning users who already finished), and OnboardingFlow can immediately notify HomeView to skip to SwipeDeck.
- **HomeView early return**: Used early return (`if auth && !onboardingCompleted → return <OnboardingFlow>`) rather than restructuring the main JSX tree. Avoids nested `<main>` elements and keeps existing header layout intact.
- **steps 4–6 TODO fallback**: OnboardingFlow renders `<div>TODO Шаг {step}</div>` for steps 4–6 — Plan 04 will replace these with QuizStep, ProfileStep, DoneStep.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added BackButton to TelegramWebApp type definition**
- **Found during:** Task 1 (use-onboarding.ts implementation)
- **Issue:** `TelegramWebApp` interface in `shared/types/telegram.d.ts` did not include `BackButton` — TypeScript reported 4 errors on wa.BackButton.show/hide/onClick/offClick
- **Fix:** Added `BackButton: { isVisible, show, hide, onClick, offClick }` to the interface
- **Files modified:** `front/shared/types/telegram.d.ts`
- **Verification:** `npx tsc --noEmit` exits 0 after fix
- **Committed in:** `db3663d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical type)
**Impact on plan:** Necessary for TypeScript compilation. No scope creep.

## Issues Encountered

None beyond the missing BackButton type (handled as deviation above).

## BackButton Cleanup Verification

`useOnboarding.ts` BackButton useEffect:
- When `step > 0 && step < 6`: calls `wa.BackButton.show()` and `wa.BackButton.onClick(handleBack)`
- When `step === 0` or `step === 6`: calls `wa.BackButton.hide()`
- Cleanup function: `return () => { wa.BackButton.offClick(handleBack); }` — always called regardless of branch

This is correct: `offClick` is always in the cleanup, preventing stale listener accumulation.

## Known Stubs

- `OnboardingFlow` steps 4, 5, 6 render `<div>TODO Шаг {step}</div>` — Plan 04 will add QuizStep, ProfileStep, DoneStep. These stubs intentionally prevent plan goal for steps 4–6 which are out of scope for plan 01-03.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 01-04 can add QuizStep (step 4), ProfileStep (step 5), DoneStep (step 6) using the existing `useOnboarding` hook (submitQuiz, submitProfile, onComplete already implemented)
- `OnboardingFlow` only needs the 3 new step components imported and wired — the router switch just needs cases 4, 5, 6
- HomeView gate and all shared infrastructure is complete

## Self-Check: PASSED

All 11 created files verified present on disk. Both task commits (db3663d, 92591b2) confirmed in git log.

---
*Phase: 1-onboarding*
*Completed: 2026-06-10*
