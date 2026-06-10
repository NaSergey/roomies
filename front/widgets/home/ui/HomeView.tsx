'use client';

import { useEffect, useState } from 'react';
import { AuthStatusChip, useTelegramAuth } from '@/features/auth';
import { OnboardingFlow, getOnboardingStatus } from '@/features/onboarding';
import { useTelegramWebApp } from '@/shared/lib/telegram';
import { SwipeDeck } from '@/widgets/swipe-deck';

type AppState = 'loading' | 'onboarding' | 'main';

export function HomeView() {
  useTelegramWebApp();
  const auth = useTelegramAuth();
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    if (auth.status !== 'authenticated') return;
    let cancelled = false;
    getOnboardingStatus()
      .then((status) => {
        if (cancelled) return;
        setAppState(status.onboardingCompleted ? 'main' : 'onboarding');
      })
      .catch(() => {
        if (!cancelled) setAppState('onboarding');
      });
    return () => { cancelled = true; };
  }, [auth.status]);

  if (auth.status === 'error') {
    return (
      <main className="mx-auto flex h-dvh w-full max-w-md flex-col items-center justify-center px-4">
        <p className="text-sm" style={{ color: 'var(--rose)' }}>
          Ошибка авторизации: {auth.error}
        </p>
      </main>
    );
  }

  if (appState === 'loading') {
    return <SplashScreen />;
  }

  if (appState === 'onboarding') {
    return <OnboardingFlow onComplete={() => setAppState('main')} />;
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

      <SwipeDeck />
    </main>
  );
}

function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="flex h-dvh w-full flex-col items-center justify-center bg-background transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-6xl" aria-hidden="true">🏠</div>
        <h1 className="text-3xl font-bold tracking-tight text-(--text)">roomies</h1>
        <div className="mt-3 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-accent"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
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
