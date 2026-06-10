'use client';

import { useState } from 'react';
import { MOCK_PROFILES } from '@/entities/profile';
import { AuthStatusChip, useTelegramAuth } from '@/features/auth';
import { OnboardingFlow } from '@/features/onboarding';
import { useTelegramWebApp } from '@/shared/lib/telegram';
import { SwipeDeck } from '@/widgets/swipe-deck';

// Композиция For You: шапка (back · For You · settings) + колода свайпа.
// Без бизнес-логики — состояние тянется хуками фич.
export function HomeView() {
  useTelegramWebApp();
  const auth = useTelegramAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // When auth is complete and onboarding not done — show full-screen OnboardingFlow
  if (auth.status === 'authenticated' && !onboardingCompleted) {
    return (
      <OnboardingFlow onComplete={() => setOnboardingCompleted(true)} />
    );
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col gap-4 px-4 pb-4 pt-3">
      <header className="flex items-center justify-between gap-2">
        <RoundIconButton ariaLabel="Назад">
          <BackIcon />
        </RoundIconButton>
        <h1 className="text-lg font-semibold tracking-tight text-(--text)">
          For You
        </h1>
        <div className="flex items-center gap-2">
          <AuthStatusChip auth={auth} />
          <RoundIconButton ariaLabel="Фильтры">
            <FiltersIcon />
          </RoundIconButton>
        </div>
      </header>

      {auth.status === 'error' && (
        <div className="rounded-2xl bg-rose-100 px-3 py-2 text-xs text-rose-700">
          Авторизация: {auth.error}
        </div>
      )}

      <SwipeDeck profiles={MOCK_PROFILES} />
    </main>
  );
}

function RoundIconButton({
  children,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-(--text) transition-transform active:scale-95"
      style={{ boxShadow: 'var(--shadow-button)' }}
    >
      {children}
    </button>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function FiltersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
  );
}
