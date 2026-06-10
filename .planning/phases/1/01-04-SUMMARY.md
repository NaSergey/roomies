---
phase: 1-onboarding
plan: "01-04"
subsystem: ui
tags: [react, nextjs, tailwind, telegram-webapp, onboarding, fsd, quiz, vibe-tags]

requires:
  - phase: 01-03
    provides: "OnboardingFlow scaffold, steps 0-3 (Scenario, Location, Budget, Dealbreakers), useOnboarding hook with submitScenario/Location/Budget/Dealbreakers"
  - phase: 01-02
    provides: "Backend POST /onboarding/quiz, PATCH /onboarding/profile, GET /vibe-tags"
  - phase: 01-01
    provides: "DB seed: quiz_questions IDs 1-10, vibe_tags table"

provides:
  - "Complete 7-step onboarding flow (steps 0-6), end-to-end navigable"
  - "QuizStep: 10 A/B questions, sub-progress, auto-advance"
  - "ProfileStep: Telegram photo, name input, vibe tag picker"
  - "DoneStep: animated checkmark, CTA to SwipeDeck"
  - "getVibeTags() API function"
  - "QUIZ_QUESTIONS constant (IDs 1-10, matching DB seed)"

affects:
  - "front/features/onboarding/ — quiz + profile + done steps added"
  - "front/shared/lib/api/ — vibe-tags API + barrel export"

tech-stack:
  added:
    - "requestAnimationFrame for animation trigger in DoneStep"
  patterns:
    - "useState(false)+useEffect+rAF for CSS transform animation (scale-0→scale-100)"
    - "cubic-bezier(0.34, 1.56, 0.64, 1) spring easing for checkmark bounce"
    - "setTimeout 300ms for quiz auto-advance with advancing guard"
    - "Cancellation guard (cancelled flag) for async getVibeTags in ProfileStep"

key-files:
  created:
    - front/features/onboarding/model/quiz-questions.ts
    - front/features/onboarding/ui/steps/QuizStep.tsx
    - front/features/onboarding/ui/steps/ProfileStep.tsx
    - front/features/onboarding/ui/steps/DoneStep.tsx
    - front/shared/lib/api/vibe-tags.ts
  modified:
    - front/features/onboarding/ui/OnboardingFlow.tsx
    - front/shared/lib/api/index.ts

decisions:
  - "DoneStep uses useState(false)+requestAnimationFrame+CSS transition instead of keyframe animation — avoids globals.css modification, same visual result"
  - "photoUrls: [] sent in PATCH /onboarding/profile — backend uses telegramPhotoUrl from auth upsert (per CONTEXT.md Decision 4)"
  - "use-onboarding.ts already had submitQuiz and submitProfile from plan 01-03 — no changes needed, verified in read-first"
  - "OnboardingFlow.tsx already had full step wiring (QuizStep/ProfileStep/DoneStep imports) — no changes needed"

metrics:
  duration: "~20 min"
  completed: "2026-06-10"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 2
---

# Phase 1 Plan 04: Quiz, Profile, Done Steps Summary

**One-liner:** 10-question A/B quiz with spring-animated Done screen and vibe tag picker, completing the 7-step onboarding flow end-to-end.

## What Was Built

### Task 1: quiz-questions.ts, vibe-tags API, OnboardingFlow wiring
- Created `QUIZ_QUESTIONS` constant with exactly 10 entries, IDs 1–10 matching the DB seed from Plan 01
- Created `getVibeTags(): Promise<VibeTag[]>` calling `GET /vibe-tags` with `auth: false`
- Added `getVibeTags` and `VibeTag` export to `shared/lib/api/index.ts` barrel
- Confirmed `OnboardingFlow.tsx` already wires QuizStep/ProfileStep/DoneStep correctly
- Confirmed `use-onboarding.ts` already exports `submitQuiz` and `submitProfile`

### Task 2: QuizStep, ProfileStep, DoneStep components
- **QuizStep**: 10 A/B questions shown one-by-one. Main progress bar (4/6) + quiz sub-progress (N/10). 300ms auto-advance with `advancing` guard. `haptic('light')` on each tap. POSTs all 10 answers via `onSubmit(allAnswers)` after last question. Loading spinner during POST.
- **ProfileStep**: Telegram photo display via `next/image` with `unoptimized` + placeholder. Name auto-populated from `initDataUnsafe.user.first_name`. `getVibeTags()` with cancellation guard and skeleton/error states. Max 3 tags enforced client-side (4th chip becomes `opacity-40 pointer-events-none`). "Готово" disabled until `name.length >= 2 && selectedTagIds.length >= 1`.
- **DoneStep**: `hapticNotify('success')` on mount. Checkmark circle animates `scale-0 → scale-100` via `useState(false) + requestAnimationFrame`. Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`, duration 400ms. SVG checkmark: `<polyline points="4 12 9 17 20 7" />`. CTA "Смотреть анкеты" calls `haptic('light') + onComplete()`.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes on Pre-existing Work

The following were found already implemented in prior commits (plan 01-03):
- `use-onboarding.ts`: `submitQuiz` and `submitProfile` handlers already present and correct
- `OnboardingFlow.tsx`: full step routing (cases 0–6) and correct prop wiring already in place

These were confirmed via read-first and required no changes. This is consistent with the plan's intent — plan 04 adds the component files themselves.

## QUIZ_QUESTIONS ID Verification

```
IDs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

All 10 questions present with correct scales:
- noiseLevel: questions 1, 6
- cleanliness: questions 2, 7  
- sleepSchedule: questions 3, 8
- socialLevel: questions 4, 9
- workFromHome: questions 5, 10

## TypeScript Verification

`npx tsc --noEmit` in `front/` — exit 0, 0 errors.

## Commits

| Hash | Description |
|------|-------------|
| d2a5e00 | feat(1-04): quiz-questions, vibe-tags API, OnboardingFlow wiring |
| c22bd93 | feat(1-04): QuizStep, ProfileStep, DoneStep components |

## Self-Check: PASSED

- front/features/onboarding/model/quiz-questions.ts: FOUND
- front/features/onboarding/ui/steps/QuizStep.tsx: FOUND
- front/features/onboarding/ui/steps/ProfileStep.tsx: FOUND
- front/features/onboarding/ui/steps/DoneStep.tsx: FOUND
- front/shared/lib/api/vibe-tags.ts: FOUND
- Commits d2a5e00, c22bd93: FOUND
