# Phase 3: Discovery & Profiles — Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 22 (new/modified files from CONTEXT.md + RESEARCH.md)
**Analogs found:** 21 / 22

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `front/widgets/candidate-profile/ui/CandidateProfileSheet.tsx` | widget | request-response | `front/widgets/swipe-deck/ui/FilterSheet.tsx` | role-match |
| `front/widgets/candidate-profile/ui/VibeScaleBar.tsx` | component | transform | `front/entities/profile/ui/ProfileCard.tsx` (SCALE_LABELS pattern) | partial |
| `front/widgets/candidate-profile/ui/RulesSection.tsx` | component | transform | `front/widgets/swipe-deck/ui/FilterSheet.tsx` Chip component | partial |
| `front/widgets/candidate-profile/ui/MatchReasonsList.tsx` | component | transform | `front/entities/profile/ui/ProfileCard.tsx` tag chips | partial |
| `front/widgets/candidate-profile/index.ts` | config | — | `front/features/swipe-profile/index.ts` | exact |
| `front/widgets/profile/ui/ProfileView.tsx` | widget | request-response | `front/widgets/swipe-deck/ui/SwipeDeck.tsx` | role-match |
| `front/widgets/profile/ui/RoomieScoreCard.tsx` | component | transform | `front/entities/profile/ui/ProfileCard.tsx` | partial |
| `front/widgets/profile/ui/ProfileEditSheet.tsx` | widget | CRUD | `front/widgets/swipe-deck/ui/FilterSheet.tsx` | role-match |
| `front/entities/profile/ui/ProfileCard.tsx` | component | transform | self (modify in-place) | — |
| `front/entities/profile/model/types.ts` | model | — | self (modify in-place) | — |
| `front/features/swipe-profile/model/use-feed-query.ts` | hook | request-response | self (modify in-place) | — |
| `front/features/profile/model/use-profile-query.ts` | hook | CRUD | `front/features/swipe-profile/model/use-feed-query.ts` | exact |
| `front/shared/lib/api/feed.ts` | utility | request-response | self (modify in-place) | — |
| `front/shared/lib/api/profile.ts` | utility | CRUD | `front/shared/lib/api/feed.ts` | exact |
| `front/widgets/swipe-deck/ui/FilterSheet.tsx` | widget | request-response | self (modify in-place) | — |
| `front/widgets/swipe-deck/ui/SwipeDeck.tsx` | widget | event-driven | self (modify in-place) | — |
| `roomies back/src/feed/feed.controller.ts` | controller | request-response | self (modify in-place) | — |
| `roomies back/src/feed/feed.service.ts` | service | CRUD | self (modify in-place) | — |
| `roomies back/src/feed/dto/feed-query.dto.ts` | model | — | `roomies back/src/onboarding/dto/dealbreakers.dto.ts` | role-match |
| `roomies back/src/profile/profile.module.ts` | config | — | `roomies back/src/feed/feed.module.ts` | exact |
| `roomies back/src/profile/profile.controller.ts` | controller | CRUD | `roomies back/src/onboarding/onboarding.controller.ts` | exact |
| `roomies back/src/profile/profile.service.ts` | service | CRUD | `roomies back/src/onboarding/onboarding.service.ts` | role-match |
| `roomies back/src/profile/dto/update-profile.dto.ts` | model | — | `roomies back/src/onboarding/dto/profile.dto.ts` + `dealbreakers.dto.ts` | role-match |
| `roomies back/src/swipe/dto/create-swipe.dto.ts` | model | — | self (1-line fix) | — |

---

## Pattern Assignments

### `front/widgets/candidate-profile/ui/CandidateProfileSheet.tsx` (widget, request-response)

**Analog:** `front/widgets/swipe-deck/ui/FilterSheet.tsx`

**Imports pattern** (lines 1–9):
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { ActionButtons, useSwipeMutation } from '@/features/swipe-profile';
import { haptic } from '@/shared/lib/telegram';
import type { RoomieProfile } from '@/entities/profile';
// Sub-components live in the same slice — import relatively, not via barrel
import { VibeScaleBar } from './VibeScaleBar';
import { RulesSection } from './RulesSection';
import { MatchReasonsList } from './MatchReasonsList';
```

**Sheet container pattern** (FilterSheet.tsx lines 72–86):
```tsx
<>
  {/* Backdrop — z-40, lower than sheet (z-50) */}
  <div
    onClick={onClose}
    className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
      open ? 'opacity-100' : 'pointer-events-none opacity-0'
    }`}
  />
  {/* Sheet — CandidateProfileSheet must be z-50 (above FilterSheet's z-40) */}
  <div
    className={`fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[92dvh] rounded-t-3xl border-t-2 border-black bg-white shadow-[0_-4px_0_rgba(20,20,15,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] ${
      open ? 'translate-y-0' : 'translate-y-full'
    }`}
  >
    {/* Handle */}
    <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[#d0d0cc]" />
    {/* Scrollable content area */}
    <div className="overflow-y-auto flex-1 overscroll-contain px-5 pt-2 pb-4 flex flex-col gap-5">
      {/* ... sections ... */}
    </div>
    {/* Sticky action buttons */}
    <div className="shrink-0 px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <ActionButtons onPass={handlePass} onLike={handleLike} />
    </div>
  </div>
</>
```

**Escape-key handler** (FilterSheet.tsx lines 61–66):
```typescript
useEffect(() => {
  if (!open) return;
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [open, onClose]);
```

**Drag-to-dismiss pattern** (derived from SwipeCard.tsx pointer events, lines 132–182):
```typescript
// Track pointer delta on the handle area:
const dragStartY = useRef(0);
const isDragging = useRef(false);

function handlePointerDown(e: React.PointerEvent) {
  isDragging.current = true;
  dragStartY.current = e.clientY;
  e.currentTarget.setPointerCapture(e.pointerId);
}
function handlePointerMove(e: React.PointerEvent) {
  if (!isDragging.current) return;
  const delta = e.clientY - dragStartY.current;
  if (delta > 0 && sheetRef.current) {
    sheetRef.current.style.transform = `translateY(${delta}px)`;
  }
}
function handlePointerUp(e: React.PointerEvent) {
  if (!isDragging.current) return;
  isDragging.current = false;
  const delta = e.clientY - dragStartY.current;
  if (delta > 100) {
    onClose(); // dismiss
  } else {
    // snap back with spring easing
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 250ms cubic-bezier(0.34,1.56,0.64,1)';
      sheetRef.current.style.transform = 'translateY(0)';
    }
  }
}
```

**Haptic pattern** (DeckToolbar.tsx lines 63, 87):
```typescript
import { haptic } from '@/shared/lib/telegram';
// On open:
haptic('light');
// On Like/Pass action:
haptic('medium');
```

**Like/Pass swipe integration** (SwipeDeck.tsx lines 26–40):
```typescript
const swipeMutation = useSwipeMutation();

async function handleLike() {
  haptic('medium');
  await swipeMutation.mutateAsync({ targetId: profile.id, action: 'like' });
  onClose();
}
async function handlePass() {
  haptic('medium');
  await swipeMutation.mutateAsync({ targetId: profile.id, action: 'pass' });
  onClose();
}
```

**Section header pattern** (FilterSheet.tsx lines 26–33, Chip component lines 35–57):
```tsx
function SectionHeader({ label }: { label: string }) {
  return (
    <span className="text-xs font-black uppercase tracking-widest text-muted">{label}</span>
  );
}
```

**Match % sticker in header** (ProfileCard.tsx lines 80–83, UI-SPEC):
```tsx
{/* Match % badge — single sticker, lime, -rotate-2 */}
<span className="rounded-md border-2 border-black bg-[#c8f36a] px-2 py-1 text-sm font-black -rotate-2 shadow-[2px_2px_0_rgba(20,20,15,0.9)]">
  ★ {matchPct}%
</span>
```

---

### `front/widgets/candidate-profile/ui/VibeScaleBar.tsx` (component, transform)

**Analog:** `front/entities/profile/ui/ProfileCard.tsx` (SCALE_LABELS + scores mapping, lines 27–45)

**Full component pattern:**
```tsx
'use client';

// Scale metadata — copy and extend SCALE_LABELS from ProfileCard.tsx
const VIBE_SCALE_META: Record<string, { label: string; icon: string }> = {
  noiseLevel:    { label: 'Тишина дома', icon: '🔇' },
  cleanliness:   { label: 'Чистота',     icon: '🧹' },
  sleepSchedule: { label: 'Режим сна',   icon: '🌙' },
  socialLevel:   { label: 'Общение',     icon: '💬' },
  workFromHome:  { label: 'Дома / работа', icon: '💻' },
};

// Track fill color changes by value range (UI-SPEC VibeScaleBar):
function fillColor(pct: number): string {
  if (pct <= 40) return 'bg-[#ffd9e0]';   // rose — mismatch
  if (pct <= 70) return 'bg-[#ffd7a8]';   // peach — neutral
  return 'bg-[#c8f36a]';                   // lime — match
}

interface VibeScaleBarProps {
  scaleKey: keyof typeof VIBE_SCALE_META;
  value: number | null; // 0.0–1.0; null → don't render
}

export function VibeScaleBar({ scaleKey, value }: VibeScaleBarProps) {
  if (value == null) return null;
  const { label, icon } = VIBE_SCALE_META[scaleKey];
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-base">{icon}</span>
      <span className="w-[100px] shrink-0 text-sm font-black text-[#14140f]">{label}</span>
      {/* Track */}
      <div className="flex-1 h-2 rounded-full bg-[#f0efe9] border-2 border-black overflow-hidden">
        {/* Fill — transition-all duration-500 ease-out */}
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fillColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-black text-[#14140f]">{pct}%</span>
    </div>
  );
}
```

**Note on `Number()` coercion:** When `value` is passed directly from `lifestyleScales` (already converted to `number | null` in the feed response Step 7), no extra coercion is needed. If the field ever comes from Prisma directly, use `Number(value)` as done in `computeLifestyleScore()` (feed.service.ts lines 88–91).

---

### `front/widgets/candidate-profile/ui/RulesSection.tsx` (component, transform)

**Analog:** `front/widgets/swipe-deck/ui/FilterSheet.tsx` Chip component (lines 35–57)

**Full component pattern:**
```tsx
'use client';

// Chip pattern copied directly from FilterSheet.tsx Chip (lines 35–57)
// active = matches current user; inactive = neutral/different
function RuleChip({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full border-2 border-black px-3 py-2 text-sm font-black ${
        active
          ? 'bg-[#c8f36a] text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)]'
          : 'bg-white text-[#6f6f68]'
      }`}
    >
      {children}
    </span>
  );
}

interface RulesSectionProps {
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: 'rarely' | 'sometimes' | 'often';
  // Optional: current user's values for match highlight
  mySmokingOk?: boolean;
  myPetsOk?: boolean;
  myGuestsPref?: 'rarely' | 'sometimes' | 'often';
}

export function RulesSection({ smokingOk, petsOk, guestsPref, mySmokingOk, myPetsOk, myGuestsPref }: RulesSectionProps) {
  const GUESTS_LABEL: Record<string, string> = {
    often: '🏠 Гости: часто',
    sometimes: '👌 Гости: иногда',
    rarely: '🤫 Гости: редко',
  };
  return (
    <div className="flex flex-wrap gap-2">
      <RuleChip active={!smokingOk && mySmokingOk === false}>
        {smokingOk ? '🚬 Курение ок' : '🚭 Не курят'}
      </RuleChip>
      <RuleChip active={petsOk && myPetsOk === true}>
        {petsOk ? '🐾 Питомцы ок' : '🚫 Без питомцев'}
      </RuleChip>
      <RuleChip active={guestsPref === myGuestsPref}>
        {GUESTS_LABEL[guestsPref]}
      </RuleChip>
    </div>
  );
}
```

---

### `front/widgets/candidate-profile/ui/MatchReasonsList.tsx` (component, transform)

**Analog:** `front/entities/profile/ui/ProfileCard.tsx` tag chips (lines 141–152)

**Tag chip pattern from ProfileCard** (lines 141–152):
```tsx
{tagLabels.slice(0, 3).map((label, i) => (
  <span
    key={label}
    className={`rounded-full border-2 border-black px-2.5 py-0.5 text-xs font-bold text-[#14140f] ${TAG_COLORS[i % TAG_COLORS.length]}`}
  >
    {label}
  </span>
))}
```

**MatchReasonsList component pattern:**
```tsx
'use client';

interface MatchReasonsListProps {
  reasons: string[];    // from backend matchReasons[]
  risks?: string[];     // from backend matchRisks[] (max 1 in Phase 3)
}

export function MatchReasonsList({ reasons, risks }: MatchReasonsListProps) {
  if (reasons.length === 0) return null; // UI-SPEC: don't render empty section

  return (
    <div className="flex flex-col gap-2">
      {reasons.map((reason) => (
        <div key={reason} className="flex items-start gap-2 text-sm text-[#14140f]">
          <span>✨</span>
          <span className="leading-snug">{reason}</span>
        </div>
      ))}
      {risks && risks[0] && (
        // Risk chip — rose bg, same border/shadow pattern as RuleChip
        <span className="mt-1 inline-flex rounded-full border-2 border-black bg-[#ffd9e0] px-3 py-2 text-xs font-black text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)]">
          ⚠️ {risks[0]}
        </span>
      )}
    </div>
  );
}
```

---

### `front/widgets/candidate-profile/index.ts` (barrel export)

**Analog:** `front/features/swipe-profile/index.ts` (lines 1–6)

```typescript
// Pattern: named exports only, no default exports — mirror swipe-profile index.ts
export { CandidateProfileSheet } from './ui/CandidateProfileSheet';
export { VibeScaleBar } from './ui/VibeScaleBar';
export { RulesSection } from './ui/RulesSection';
export { MatchReasonsList } from './ui/MatchReasonsList';
```

---

### `front/widgets/profile/ui/ProfileView.tsx` (widget, request-response)

**Analog:** `front/widgets/swipe-deck/ui/SwipeDeck.tsx` (loading/error/data states, lines 47–71)

**Loading / error / data pattern** (SwipeDeck.tsx lines 47–71):
```tsx
if (isLoading) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-accent"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

if (isError) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-3xl">⚠️</p>
      <p className="text-sm font-semibold text-(--text)">...</p>
      <button type="button" onClick={() => refetch()} className="...">Повторить</button>
    </div>
  );
}
```

**ProfileView full pattern:**
```tsx
'use client';

import { useState } from 'react';
import { useProfileQuery } from '@/features/profile';
import { VibeScaleBar, RulesSection } from '@/widgets/candidate-profile';
import { RoomieScoreCard } from './RoomieScoreCard';
import { ProfileEditSheet } from './ProfileEditSheet';

export function ProfileView() {
  const [editOpen, setEditOpen] = useState(false);
  const { data: profile, isLoading, isError, refetch } = useProfileQuery();

  if (isLoading) { /* bounce dots — same as SwipeDeck */ }
  if (isError) { /* error state — same as SwipeDeck */ }

  return (
    <div className="flex flex-col gap-6 overflow-y-auto px-5 py-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-(--text)">Профиль</h3>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="text-sm font-black underline underline-offset-2 text-[#14140f]"
        >
          Изменить
        </button>
      </div>
      {/* Photo + name */}
      {/* Roomie Score */}
      <RoomieScoreCard
        score={profile.roomieScore}
        hasPhoto={profile.photos.length > 0}
        quizCompleted={profile.quizCompleted}
        dealbreakersDone={profile.onboardingStep >= 4}
        phoneVerified={profile.isPhoneVerified}
      />
      {/* Vibe scales (read-only) */}
      {/* Rules (read-only) */}
      <ProfileEditSheet open={editOpen} profile={profile} onClose={() => setEditOpen(false)} />
    </div>
  );
}
```

---

### `front/widgets/profile/ui/RoomieScoreCard.tsx` (component, transform)

**Analog:** `front/entities/profile/ui/ProfileCard.tsx` (sticker badge pattern + HARD_SHADOW, lines 25–26, 111–127)

**Sticker / card border pattern** (ProfileCard.tsx lines 25–26):
```typescript
const HARD_SHADOW = 'shadow-[4px_4px_0_rgba(20,20,15,0.9)]';
// Sticker: rounded-md border-2 border-black px-1.5 py-0.5 text-[11px] font-black leading-none
```

**Progress bar pattern** (derived from UI-SPEC — existing pattern in codebase: CSS width transition):
```tsx
{/* Progress bar — no library, pure CSS width transition */}
<div className="h-3 w-full rounded-full border border-black bg-white overflow-hidden">
  <div
    className="h-full rounded-full bg-[#c8f36a] transition-all duration-700 ease-out"
    style={{ width: `${score}%` }}
  />
</div>
```

**RoomieScoreCard component pattern:**
```tsx
'use client';

interface RoomieScoreCardProps {
  score: number;          // 0–40 in Phase 3 (40 max without phone)
  hasPhoto: boolean;
  quizCompleted: boolean;
  dealbreakersDone: boolean; // onboardingStep >= 4
  phoneVerified: boolean;    // always false in Phase 3
}

// Tips — ordered, fixed 4 items (UI-SPEC)
// MAX_SCORE = 40 in Phase 3
const MAX_SCORE = 40;

export function RoomieScoreCard({ score, hasPhoto, quizCompleted, dealbreakersDone, phoneVerified }: RoomieScoreCardProps) {
  const pct = Math.round((score / MAX_SCORE) * 100);
  const tips = [
    { done: hasPhoto,        text: 'Фото добавлены',      points: 10, icon: '📷', inactive: false },
    { done: quizCompleted,   text: 'Vibe Quiz пройден',   points: 10, icon: '🎯', inactive: false },
    { done: dealbreakersDone,text: 'Правила указаны',     points: 10, icon: '📋', inactive: false },
    { done: phoneVerified,   text: 'Верификация телефона',points: 10, icon: '📞', inactive: true }, // Phase 6
  ];

  return (
    <div className="rounded-2xl border-2 border-black bg-[#f0efe9] p-4 shadow-[4px_4px_0_rgba(20,20,15,0.9)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-[#6f6f68]">ROOMIE SCORE</span>
        <span className="font-age text-2xl font-black text-[#14140f]">{score} / {MAX_SCORE}</span>
      </div>
      <div className="mt-2 h-3 w-full rounded-full border border-black bg-white overflow-hidden">
        <div
          className="h-full rounded-full bg-[#c8f36a] transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {tips.map((tip) => (
          <div key={tip.text} className={`flex items-center gap-2 text-sm ${tip.inactive ? 'opacity-40' : ''}`}>
            <span>{tip.done ? '✓' : '○'}</span>
            <span className={`font-black text-[#14140f] ${tip.done ? 'line-through' : ''}`}>
              {tip.icon} {tip.text}
            </span>
            <span className={`ml-auto rounded-md border border-black px-1.5 py-0.5 text-xs font-black ${
              tip.done ? 'bg-[#c8f36a]' : 'bg-[#fff3a0]'
            }`}>
              +{tip.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### `front/widgets/profile/ui/ProfileEditSheet.tsx` (widget, CRUD)

**Analog:** `front/widgets/swipe-deck/ui/FilterSheet.tsx` (full sheet structure)

**Imports pattern:**
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { haptic } from '@/shared/lib/telegram';
import { usePatchProfile } from '@/features/profile';
// Profile type from GET /profile/me response
```

**Sheet container** — identical to FilterSheet.tsx (lines 71–137). Key differences:

```tsx
{/* Same container classes as FilterSheet */}
<div className={`fixed inset-x-0 bottom-0 z-50 flex flex-col gap-5 rounded-t-3xl border-t-2 border-black bg-white px-5 pt-4 pb-8 shadow-[0_-4px_0_rgba(20,20,15,0.9)] max-h-[92dvh] overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] ${open ? 'translate-y-0' : 'translate-y-full'}`}>
  <div className="mx-auto h-1 w-10 rounded-full bg-[#d0d0cc]" />

  <div className="flex items-center justify-between">
    <h3 className="text-lg font-black text-(--text)">Редактировать</h3>
    <button type="button" onClick={onClose} className="text-xs font-bold text-muted underline underline-offset-2">Отмена</button>
  </div>

  {/* Form sections: name, photos (URL input), vibeTags, budget, districts, dealbreakers */}

  {/* CTA — identical to FilterSheet button (lines 129–135) */}
  <button
    type="button"
    onClick={handleSave}
    disabled={patchMutation.isPending}
    className="mt-1 w-full rounded-full border-2 border-black bg-accent py-3 text-sm font-black text-[#14140f] shadow-[3px_3px_0_rgba(20,20,15,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_rgba(20,20,15,0.9)] transition-all duration-100 disabled:opacity-60"
  >
    Сохранить профиль
  </button>

  {/* Inline error — below CTA per UI-SPEC */}
  {patchMutation.isError && (
    <p className="text-center text-xs text-[#ff6b85]">Не сохранилось. Проверь соединение и попробуй ещё раз</p>
  )}
</div>
```

**Form field pattern** (input style from UI-SPEC, consistent with FilterSheet chip style):
```tsx
<input
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="border-2 border-black rounded-xl px-4 py-3 text-sm font-black bg-white w-full focus:outline-none focus:ring-2 focus:ring-[#c8f36a]"
/>
```

**Multiselect chip pattern** (same Chip from FilterSheet, lines 35–57, toggled to active/inactive):
```tsx
// Vibe tag chip (max 3):
<button
  type="button"
  onClick={() => toggleTag(tag.id)}
  disabled={!selectedTagIds.includes(tag.id) && selectedTagIds.length >= 3}
  className={`rounded-full border-2 border-black px-3 py-1 text-sm font-bold transition-all duration-150 active:scale-95 ${
    selectedTagIds.includes(tag.id)
      ? 'bg-accent text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)]'
      : 'bg-white text-[#6f6f68]'
  } disabled:opacity-50 disabled:pointer-events-none`}
>
  {tag.label}
</button>
```

**Save handler:**
```typescript
async function handleSave() {
  haptic('medium');
  try {
    await patchMutation.mutateAsync({
      name,
      photoUrls,
      vibeTagIds: selectedTagIds,
      budgetMin: Number(budgetMin) || null,
      budgetMax: Number(budgetMax) || null,
      districtIds: selectedDistrictIds,
      smokingOk,
      petsOk,
      guestsPref,
    });
    haptic('success' as any);  // or hapticNotify('success')
    onClose();
  } catch {
    // Error shown inline below CTA
  }
}
```

---

### `front/entities/profile/ui/ProfileCard.tsx` (component, modify)

**Analog:** self (modify in-place)

**Change 1 — Remove 3 score stickers, add single ★ N% badge** (lines 80–83 and 109–127):

Remove the entire scores block (lines 109–127):
```tsx
// DELETE this block:
{scores.length > 0 && (
  <div className="flex flex-col items-end gap-2">
    {scores.map((s, i) => { ... })}
  </div>
)}
```

Replace GradientBackground badge (lines 80–83) with plain sticker:
```tsx
// BEFORE (line 80–83):
<GradientBackground className={`absolute left-0 top-0 z-[2] -rotate-[5deg] ${HARD_SHADOW}`}>
  {matchPct}%
</GradientBackground>

// AFTER (UI-SPEC ProfileCard section):
<span className={`absolute left-0 top-0 z-[2] -rotate-[5deg] rounded-md border-2 border-black bg-[#c8f36a] px-2 py-1 text-sm font-black text-[#14140f] ${HARD_SHADOW}`}>
  ★ {matchPct}%
</span>
```

Remove the `SCORE_META` constant (lines 14–18) and `SCALE_LABELS` (lines 27–33) and `scores` computation (lines 40–45) since they are no longer used.

Remove the `GradientBackground` import (line 5) once replaced.

---

### `front/entities/profile/model/types.ts` (model, modify)

**Analog:** self (modify in-place)

**Extension pattern** (add 3 new fields + matchReasons/matchRisks):
```typescript
// BEFORE (lines 1–19):
export interface RoomieProfile { ... }

// AFTER — add the following fields:
export interface RoomieProfile {
  id: number;
  name: string;
  age?: number;
  scenario: string;
  budgetMin: number | null;
  budgetMax: number | null;
  smokingOk: boolean;        // NEW — needed for RulesSection
  petsOk: boolean;           // NEW — needed for RulesSection
  guestsPref: 'rarely' | 'sometimes' | 'often'; // NEW — needed for RulesSection
  photos: string[];
  vibeTags: { id: number; label: string }[];
  districts: { id: number; name: string }[];
  lifestyleScales: {
    noiseLevel: number | null;
    cleanliness: number | null;
    sleepSchedule: number | null;
    socialLevel: number | null;
    workFromHome: number | null;
  } | null;
  matchScore: number;
  matchReasons: string[];   // NEW — from backend, 2–3 items
  matchRisks?: string[];    // NEW — from backend, 0–1 items in Phase 3
}
```

---

### `front/features/swipe-profile/model/use-feed-query.ts` (hook, modify)

**Analog:** self (modify in-place)

**Current state** (lines 1–31) — no params, static queryKey `['feed']`.

**Extension pattern** (RESEARCH.md Pattern 1):
```typescript
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeed, postSwipe } from '@/shared/lib/api';
import type { FeedQueryParams } from '@/shared/lib/api/feed';

export const feedKeys = {
  all: ['feed'] as const,
  filtered: (params: FeedQueryParams) => ['feed', params] as const,
};

export function useFeedQuery(params?: FeedQueryParams) {
  return useQuery({
    queryKey: params ? feedKeys.filtered(params) : feedKeys.all,
    queryFn: () => getFeed(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSwipeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetId, action }: { targetId: number; action: 'like' | 'pass' | 'super_like' | 'save' }) =>
      postSwipe(targetId, action),
    onSuccess: (_data, { action }) => {
      // Use exact: false to invalidate all ['feed', *] keys regardless of params
      if (action === 'like' || action === 'super_like') {
        queryClient.invalidateQueries({ queryKey: ['feed'], exact: false });
      }
    },
  });
}
```

---

### `front/features/profile/model/use-profile-query.ts` (hook, CRUD)

**Analog:** `front/features/swipe-profile/model/use-feed-query.ts` (exact pattern, lines 1–31)

**Full file:**
```typescript
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, patchProfile } from '@/shared/lib/api/profile';

export const profileKeys = {
  me: ['profile', 'me'] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: getMe,
    staleTime: Infinity, // profile rarely changes; invalidated on save
  });
}

export function usePatchProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}
```

**Barrel export** — create `front/features/profile/index.ts`:
```typescript
export { useProfileQuery, usePatchProfile, profileKeys } from './model/use-profile-query';
```

---

### `front/shared/lib/api/profile.ts` (utility, CRUD)

**Analog:** `front/shared/lib/api/feed.ts` (lines 1–41, exact pattern)

**Full file:**
```typescript
'use client';

import { apiFetch } from './client';

export interface OwnProfile {
  id: number;
  name: string;
  age?: number;
  photos: string[];
  vibeTags: { id: number; label: string }[];
  districts: { id: number; name: string }[];
  lifestyleScales: {
    noiseLevel: number | null;
    cleanliness: number | null;
    sleepSchedule: number | null;
    socialLevel: number | null;
    workFromHome: number | null;
  } | null;
  budgetMin: number | null;
  budgetMax: number | null;
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: 'rarely' | 'sometimes' | 'often';
  scenario: string;
  roomieScore: number;
  quizCompleted: boolean;
  isPhoneVerified: boolean;
  onboardingStep: number;
}

export interface UpdateProfilePayload {
  name?: string;
  photoUrls?: string[];
  vibeTagIds?: number[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  districtIds?: number[];
  smokingOk?: boolean;
  petsOk?: boolean;
  guestsPref?: 'rarely' | 'sometimes' | 'often';
}

export function getMe(): Promise<OwnProfile> {
  return apiFetch<OwnProfile>('/profile/me', { method: 'GET' });
}

export function patchProfile(dto: UpdateProfilePayload): Promise<{ ok: true }> {
  return apiFetch('/profile', { method: 'PATCH', body: dto });
}
```

---

### `front/shared/lib/api/feed.ts` (utility, modify)

**Analog:** self (modify in-place)

**Extend `FeedCandidate` interface** (lines 4–22) to add new fields:
```typescript
export interface FeedQueryParams {
  budgetMin?: number;
  budgetMax?: number;
  districtIds?: number[];
  smokingOk?: boolean;
  petsOk?: boolean;
  guestsPref?: 'rarely' | 'sometimes' | 'often';
}

export interface FeedCandidate {
  // ... existing fields ...
  smokingOk: boolean;      // NEW
  petsOk: boolean;         // NEW
  guestsPref: 'rarely' | 'sometimes' | 'often'; // NEW
  matchReasons: string[];  // NEW
  matchRisks?: string[];   // NEW
  // matchScore already exists
}
```

**Update `getFeed` signature** (line 29):
```typescript
export function getFeed(params?: FeedQueryParams): Promise<FeedCandidate[]> {
  const query = params ? '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .flatMap(([k, v]) => Array.isArray(v)
        ? v.map((item) => [`${k}[]`, String(item)])
        : [[k, String(v)]]
      )
  ).toString() : '';
  return apiFetch<FeedCandidate[]>(`/feed${query}`, { method: 'GET' });
}
```

**Update `postSwipe`** (line 33–41) — add `'save'` to action union:
```typescript
export function postSwipe(
  targetId: number,
  action: 'like' | 'pass' | 'super_like' | 'save',
): Promise<SwipeResult> {
  return apiFetch<SwipeResult>('/swipes', {
    method: 'POST',
    body: { targetId, action },
  });
}
```

---

### `front/widgets/swipe-deck/ui/FilterSheet.tsx` (widget, modify)

**Analog:** self (modify in-place)

**DeckFilters type extension** (lines 5–10 → replace):
```typescript
export interface DeckFilters {
  // Existing
  age: '18-22' | '23-26' | '27-30' | 'all';
  schedule: 'early' | 'night' | 'any';
  cleanliness: 'neat' | 'normal' | 'relaxed' | 'any';
  budget: 'low' | 'mid' | 'high' | 'any';
  // New Phase 3
  districtIds: number[];
  smokingOk: boolean | null;    // null = any
  petsOk: boolean | null;       // null = any
  guestsPref: 'often' | 'sometimes' | 'rarely' | null; // null = any
}

export const DEFAULT_FILTERS: DeckFilters = {
  age: 'all',
  schedule: 'any',
  cleanliness: 'any',
  budget: 'any',
  districtIds: [],
  smokingOk: null,
  petsOk: null,
  guestsPref: null,
};
```

**Add `onApply` prop** (lines 19–24):
```typescript
interface FilterSheetProps {
  open: boolean;
  filters: DeckFilters;
  onChange: (f: DeckFilters) => void;
  onClose: () => void;
  onApply: (filters: DeckFilters) => void;  // NEW
}
```

**Replace button handler** (line 129–135):
```tsx
// BEFORE: onClick={onClose}   text: "Показать результаты"
// AFTER:
<button
  type="button"
  onClick={() => { onApply(filters); onClose(); }}
  className="mt-1 w-full rounded-full border-2 border-black bg-accent py-3 text-sm font-black text-[#14140f] shadow-[3px_3px_0_rgba(20,20,15,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_rgba(20,20,15,0.9)] transition-all duration-100"
>
  Применить
</button>
```

**DeckToolbar activeCount fix** for array fields (DeckToolbar.tsx lines 29–33):
```typescript
// Replace activeCount to handle array comparison:
function activeCount(f: DeckFilters) {
  return (Object.keys(f) as (keyof DeckFilters)[]).filter((k) => {
    if (Array.isArray(f[k])) {
      return JSON.stringify(f[k]) !== JSON.stringify(DEFAULT_FILTERS[k]);
    }
    return f[k] !== DEFAULT_FILTERS[k];
  }).length;
}
```

---

### `front/widgets/swipe-deck/ui/SwipeDeck.tsx` (widget, modify)

**Analog:** self (modify in-place)

**Add queryParams state + filter wiring** (after line 14):
```typescript
const [queryParams, setQueryParams] = useState<FeedQueryParams>({});
const { data: profiles = [], isLoading, isError, error, refetch } = useFeedQuery(queryParams);

// filtersToQueryParams — converts DeckFilters UI values to API params
function filtersToQueryParams(filters: DeckFilters): FeedQueryParams {
  const params: FeedQueryParams = {};
  if (filters.budget === 'low')  { params.budgetMin = 0;     params.budgetMax = 20000; }
  if (filters.budget === 'mid')  { params.budgetMin = 20000; params.budgetMax = 35000; }
  if (filters.budget === 'high') { params.budgetMin = 35000; }
  if (filters.districtIds.length > 0) params.districtIds = filters.districtIds;
  if (filters.smokingOk !== null) params.smokingOk = filters.smokingOk;
  if (filters.petsOk !== null)    params.petsOk = filters.petsOk;
  if (filters.guestsPref !== null) params.guestsPref = filters.guestsPref;
  return params;
}

const handleApplyFilters = useCallback((filters: DeckFilters) => {
  setQueryParams(filtersToQueryParams(filters));
}, []);
```

**Add `onCardTap` state + CandidateProfileSheet** (after matchState state):
```typescript
const [profileSheetProfile, setProfileSheetProfile] = useState<RoomieProfile | null>(null);
```

**Pass `onApply` to FilterSheet** (line 128):
```tsx
<FilterSheet
  open={filterOpen}
  filters={filters}
  onChange={setFilters}
  onClose={() => setFilterOpen(false)}
  onApply={handleApplyFilters}  // NEW
/>
```

**Tap detection on SwipeCard** — add `onCardTap` prop to SwipeCard (SwipeCard.tsx `handlePointerEnd`, lines 151–181):
```typescript
// In SwipeCard handlePointerEnd, after `const direction = ...`:
if (!direction) {
  // tap: delta < 10px in both axes
  const dy = e.clientY - startYRef.current; // need to track startY too
  if (Math.hypot(x, dy) < 10) {
    onCardTap?.(); // NEW prop
    return;
  }
  // ... spring back
}
```

---

### `roomies back/src/feed/dto/feed-query.dto.ts` (model, new)

**Analog:** `roomies back/src/onboarding/dto/dealbreakers.dto.ts` (lines 1–16)

**Full file:**
```typescript
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GuestsPreference } from '@prisma/client';

export class FeedQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  budgetMax?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  districtIds?: number[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  smokingOk?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  petsOk?: boolean;

  @IsOptional()
  @IsEnum(GuestsPreference)
  guestsPref?: GuestsPreference;
}
```

---

### `roomies back/src/feed/feed.controller.ts` (controller, modify)

**Analog:** self (modify in-place; add `@Query()`)

**Current** (lines 16–18):
```typescript
getFeed(@CurrentUser() user: { id: number }) {
  return this.feed.getFeed(user.id);
}
```

**After** (add Query import + param):
```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FeedQueryDto } from './dto/feed-query.dto';

@Get()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Лента кандидатов для текущего пользователя' })
getFeed(
  @CurrentUser() user: { id: number },
  @Query() query: FeedQueryDto,
) {
  return this.feed.getFeed(user.id, query);
}
```

---

### `roomies back/src/feed/feed.service.ts` (service, modify)

**Analog:** self (modify in-place)

**Key additions:**

1. Update `getFeed` signature (line 104) to accept optional query params:
```typescript
async getFeed(userId: number, query?: FeedQueryDto) {
```

2. Override SQL hard filters with query params where provided (lines 151–168):
```typescript
// When query.smokingOk / petsOk provided, use them; else default to me.smokingOk / me.petsOk
const filterSmokingOk = query?.smokingOk !== undefined ? query.smokingOk : me.smokingOk;
const filterPetsOk    = query?.petsOk !== undefined    ? query.petsOk    : me.petsOk;

// Budget filter: query params override me's budget
const effectiveBudgetMin = query?.budgetMin ?? me.budgetMin;
const effectiveBudgetMax = query?.budgetMax ?? me.budgetMax;

// District filter (optional additional SQL filter):
const districtFilter: Prisma.UserWhereInput = query?.districtIds?.length
  ? { districts: { some: { districtId: { in: query.districtIds } } } }
  : {};
```

3. Add `generateMatchReasons` and `generateMatchRisks` private methods (inside `FeedService` class):
```typescript
// Pattern: uses Number() coercion for Prisma Decimal — same as computeLifestyleScore (lines 88–91)
private generateMatchReasons(me: UserScoreFields, candidate: UserScoreFields & { guestsPref?: string }): string[] {
  const reasons: string[] = [];
  const diff = (a: object | null, b: object | null) =>
    a != null && b != null ? Math.abs(Number(a) - Number(b)) : Infinity;

  if (diff(me.sleepSchedule, candidate.sleepSchedule) < 0.2) reasons.push('Похожий режим сна');
  if (diff(me.noiseLevel, candidate.noiseLevel) < 0.2)       reasons.push('Оба любят тишину дома');
  if (diff(me.cleanliness, candidate.cleanliness) < 0.2)     reasons.push('Одинаковый подход к чистоте');
  if (diff(me.socialLevel, candidate.socialLevel) < 0.2)     reasons.push('Схожий уровень общительности');
  if (diff(me.workFromHome, candidate.workFromHome) < 0.2)   reasons.push('Похожий режим работы');
  if (!me.smokingOk && !candidate.smokingOk)                 reasons.push('Оба не курят');
  if (me.petsOk && candidate.petsOk)                         reasons.push('Оба любят питомцев');

  return reasons.slice(0, 3); // D-07: 2–3 max
}

private generateMatchRisks(me: { guestsPref?: string }, candidate: { guestsPref?: string }): string[] {
  const risks: string[] = [];
  if (me.guestsPref && candidate.guestsPref && me.guestsPref !== candidate.guestsPref) {
    const extreme = (me.guestsPref === 'rarely' && candidate.guestsPref === 'often')
                 || (me.guestsPref === 'often' && candidate.guestsPref === 'rarely');
    if (extreme) risks.push('Разное отношение к гостям');
  }
  return risks.slice(0, 1); // D-08: max 1
}
```

4. Extend Step 7 response map (lines 212–233) to include new fields:
```typescript
return top20.map((c) => ({
  // ... existing fields ...
  smokingOk: c.smokingOk,        // NEW
  petsOk: c.petsOk,              // NEW
  guestsPref: c.guestsPref,      // NEW — add to select query too
  matchReasons: this.generateMatchReasons(me, c),  // NEW
  matchRisks: this.generateMatchRisks(me, c),      // NEW
}));
```

5. Add `guestsPref` to the Prisma select in Step 4 (lines 170–197):
```typescript
// In select block — add:
guestsPref: true,
```

Also add `guestsPref` to `UserWithScores` and `UserScoreFields` types.

---

### `roomies back/src/profile/profile.module.ts` (config, new)

**Analog:** `roomies back/src/feed/feed.module.ts` (lines 1–11, exact)

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
```

Then register in `app.module.ts` (add alongside other modules):
```typescript
import { ProfileModule } from './profile/profile.module';
// In @Module imports array:
ProfileModule,
```

---

### `roomies back/src/profile/profile.controller.ts` (controller, new)

**Analog:** `roomies back/src/onboarding/onboarding.controller.ts` (exact pattern, lines 1–105)

**Full file:**
```typescript
import { Body, Controller, Get, HttpCode, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить собственный профиль с Roomie Score' })
  getMe(@CurrentUser() user: { id: number }) {
    return this.profile.getMe(user.id);
  }

  @Patch()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить профиль (имя, фото, теги, бюджет, районы, правила)' })
  updateProfile(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profile.updateProfile(user.id, dto);
  }
}
```

---

### `roomies back/src/profile/profile.service.ts` (service, new)

**Analog:** `roomies back/src/onboarding/onboarding.service.ts` (saveProfile + saveLocation patterns, lines 188–235 and 105–123)

**Key patterns to copy:**

`$transaction` with deleteMany + createMany (onboarding.service.ts lines 107–122 for districts, 210–228 for photos/vibeTags):
```typescript
await this.prisma.$transaction([
  this.prisma.user.update({ where: { id: userId }, data: { ...fields } }),
  this.prisma.userDistrict.deleteMany({ where: { userId } }),
  ...(districtIds.length > 0
    ? [this.prisma.userDistrict.createMany({
        data: districtIds.map((districtId) => ({ userId, districtId })),
        skipDuplicates: true,
      })]
    : []),
  this.prisma.userVibeTag.deleteMany({ where: { userId } }),
  ...(vibeTagIds.length > 0
    ? [this.prisma.userVibeTag.createMany({
        data: vibeTagIds.map((tagId) => ({ userId, tagId })),
        skipDuplicates: true,
      })]
    : []),
  this.prisma.userPhoto.deleteMany({ where: { userId } }),
  ...(photoUrls.length > 0
    ? [this.prisma.userPhoto.createMany({
        data: photoUrls.map((url, i) => ({ userId, url, displayOrder: i })),
      })]
    : []),
]);
return { ok: true };
```

**Roomie Score computation** (RESEARCH.md Pattern 6):
```typescript
private computeRoomieScore(user: {
  photos: { url: string }[];
  quizCompleted: boolean;
  onboardingStep: number;
  isPhoneVerified: boolean;
}): number {
  let score = 0;
  if (user.photos.length > 0) score += 10;
  if (user.quizCompleted) score += 10;
  if (user.onboardingStep >= 4) score += 10;
  if (user.isPhoneVerified) score += 10;
  return score;
}
```

**`getMe` method:**
```typescript
async getMe(userId: number) {
  const user = await this.prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true, name: true, birthDate: true, scenario: true,
      budgetMin: true, budgetMax: true, moveInDate: true,
      smokingOk: true, petsOk: true, guestsPref: true,
      noiseLevel: true, cleanliness: true, sleepSchedule: true, socialLevel: true, workFromHome: true,
      quizCompleted: true, onboardingStep: true, isPhoneVerified: true,
      photos: { select: { url: true }, orderBy: { displayOrder: 'asc' } },
      vibeTags: { select: { tag: { select: { id: true, label: true } } } },
      districts: { select: { district: { select: { id: true, name: true } } } },
    },
  });

  const roomieScore = this.computeRoomieScore(user);
  // Persist updated score (keeps DB in sync):
  await this.prisma.user.update({ where: { id: userId }, data: { roomieScore } });

  return {
    ...user,
    roomieScore,
    photos: user.photos.map((p) => p.url),
    vibeTags: user.vibeTags.map((vt) => ({ id: vt.tag.id, label: vt.tag.label })),
    districts: user.districts.map((d) => ({ id: d.district.id, name: d.district.name })),
    lifestyleScales: {
      noiseLevel: user.noiseLevel ? Number(user.noiseLevel) : null,
      cleanliness: user.cleanliness ? Number(user.cleanliness) : null,
      sleepSchedule: user.sleepSchedule ? Number(user.sleepSchedule) : null,
      socialLevel: user.socialLevel ? Number(user.socialLevel) : null,
      workFromHome: user.workFromHome ? Number(user.workFromHome) : null,
    },
  };
}
```

---

### `roomies back/src/profile/dto/update-profile.dto.ts` (model, new)

**Analog:** `roomies back/src/onboarding/dto/profile.dto.ts` + `dealbreakers.dto.ts`

**Full file:**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photoUrls?: string[];

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(5)
  vibeTagIds?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  budgetMin?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  budgetMax?: number | null;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  districtIds?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  smokingOk?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  petsOk?: boolean;

  @ApiProperty({ required: false, enum: ['rarely', 'sometimes', 'often'] })
  @IsOptional()
  @IsEnum(['rarely', 'sometimes', 'often'])
  guestsPref?: string;
}
```

---

### `roomies back/src/swipe/dto/create-swipe.dto.ts` (model, 1-line fix)

**Analog:** self

**Current** (lines 3–7):
```typescript
export enum SwipeActionDto {
  like = 'like',
  pass = 'pass',
  super_like = 'super_like',
}
```

**After — add `save`:**
```typescript
export enum SwipeActionDto {
  like = 'like',
  pass = 'pass',
  super_like = 'super_like',
  save = 'save',   // ADD THIS LINE
}
```

---

## Shared Patterns

### Authentication Guard
**Source:** `roomies back/src/auth/jwt-auth.guard.ts` (lines 20–38) + `roomies back/src/auth/current-user.decorator.ts` (lines 1–9)
**Apply to:** All new backend controller endpoints (`GET /profile/me`, `PATCH /profile`, extended `GET /feed`)
```typescript
// Always pair:
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
// And use @CurrentUser() to get identity — NEVER take userId from body/query
@CurrentUser() user: { id: number }
```

### API Fetch with Auth
**Source:** `front/shared/lib/api/client.ts` (lines 22–53)
**Apply to:** All new frontend API functions (`getMe`, `patchProfile`, extended `getFeed`)
```typescript
// Always use apiFetch — never raw fetch():
import { apiFetch } from './client';
// It handles: Bearer token injection, JSON serialization, error throw on non-2xx
```

### Neobrutalism Button (Primary CTA)
**Source:** `front/widgets/swipe-deck/ui/FilterSheet.tsx` (lines 129–135)
**Apply to:** "Применить" in FilterSheet, "Сохранить профиль" in ProfileEditSheet
```tsx
className="w-full rounded-full border-2 border-black bg-accent py-3 text-sm font-black text-[#14140f] shadow-[3px_3px_0_rgba(20,20,15,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_rgba(20,20,15,0.9)] transition-all duration-100"
```

### Neobrutalism Chip
**Source:** `front/widgets/swipe-deck/ui/FilterSheet.tsx` Chip component (lines 35–57)
**Apply to:** RulesSection chips, MatchReasonsList risk chip, FilterSheet new filter rows, ProfileEditSheet multiselect chips
```tsx
className={`rounded-full border-2 border-black px-3 py-1 text-sm font-bold transition-all duration-150 active:scale-95 ${
  active ? 'bg-accent text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)]' : 'bg-white text-[#6f6f68]'
}`}
```

### Hard Shadow Token
**Source:** `front/entities/profile/ui/ProfileCard.tsx` (line 25)
**Apply to:** All sticker-style elements, RoomieScoreCard card, badge overlays
```typescript
const HARD_SHADOW = 'shadow-[4px_4px_0_rgba(20,20,15,0.9)]';
// Smaller shadow for chips: 'shadow-[2px_2px_0_rgba(20,20,15,0.9)]'
```

### Sheet Open/Close Animation
**Source:** `front/widgets/swipe-deck/ui/FilterSheet.tsx` (lines 83–86)
**Apply to:** `CandidateProfileSheet`, `ProfileEditSheet`
```
open:   translate-y-0
closed: translate-y-full
transition: transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]
close-fast: duration-200 ease-in
snap-back: cubic-bezier(0.34,1.56,0.64,1) duration-250ms
```

### Section Row Header
**Source:** `front/widgets/swipe-deck/ui/FilterSheet.tsx` Row component (lines 26–33)
**Apply to:** All section headings inside CandidateProfileSheet, ProfileEditSheet, ProfileView
```tsx
<span className="text-xs font-black uppercase tracking-widest text-muted">{label}</span>
```

### Haptic Feedback
**Source:** `front/widgets/swipe-deck/ui/DeckToolbar.tsx` (lines 63, 87)
**Apply to:** All interactive buttons (filter open, like, pass, save profile, apply filters)
```typescript
import { haptic } from '@/shared/lib/telegram';
haptic('light');   // for opens / filter apply
haptic('medium');  // for swipe actions (like, pass, save)
// hapticNotify('success') for successful profile save
```

### Prisma Transaction (delete-then-create many-to-many)
**Source:** `roomies back/src/onboarding/onboarding.service.ts` (lines 107–122, 210–228)
**Apply to:** `ProfileService.updateProfile()` for photos, vibeTags, districts
```typescript
await this.prisma.$transaction([
  this.prisma.userVibeTag.deleteMany({ where: { userId } }),
  ...(ids.length > 0 ? [this.prisma.userVibeTag.createMany({ data: ids.map(id => ({ userId, tagId: id })), skipDuplicates: true })] : []),
]);
```

### Number() Coercion for Prisma Decimal
**Source:** `roomies back/src/feed/feed.service.ts` (lines 88–91, 225–230)
**Apply to:** `generateMatchReasons` scale comparisons, `getMe` lifestyleScales mapping
```typescript
// ALWAYS convert before arithmetic:
Math.abs(Number(me.sleepSchedule) - Number(candidate.sleepSchedule))
// In response map:
noiseLevel: c.noiseLevel ? Number(c.noiseLevel) : null,
```

### React Query invalidation with params
**Source:** `front/features/swipe-profile/model/use-feed-query.ts` (lines 19–30)
**Apply to:** `useSwipeMutation` (extended), `usePatchProfile`
```typescript
// Use exact: false to match all sub-keys ['feed', *params*]:
queryClient.invalidateQueries({ queryKey: ['feed'], exact: false });
// Profile invalidation (single key, exact: true is fine):
queryClient.invalidateQueries({ queryKey: profileKeys.me });
```

---

## No Analog Found

All files have analogs. No files require pure RESEARCH.md pattern fallback.

---

## Metadata

**Analog search scope:** `front/widgets/`, `front/features/`, `front/entities/`, `front/shared/`, `roomies back/src/`
**Files scanned:** 24 source files read directly
**Pattern extraction date:** 2026-06-22
