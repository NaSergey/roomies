'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTelegramAuth } from '@/features/auth';
import { OnboardingFlow, getOnboardingStatus } from '@/features/onboarding';
import { BottomNav, type NavTab } from '@/widgets/bottom-nav';
import { ChatView } from '@/widgets/chat';
import { ProfileView } from '@/widgets/profile';
import { SwipeDeck } from '@/widgets/swipe-deck';

export function HomeView() {
  const auth = useTelegramAuth();

  const { data: onboardingStatus, isPending } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: getOnboardingStatus,
    enabled: auth.status === 'authenticated',
    staleTime: Infinity, // статус меняется только после прохождения онбординга
  });

  if (auth.status === 'error') {
    return (
      <main className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center px-4">
        <p className="text-sm" style={{ color: 'var(--rose)' }}>
          Ошибка авторизации: {auth.error}
        </p>
      </main>
    );
  }

  if (auth.status !== 'authenticated' || isPending) {
    return <SplashScreen />;
  }

  if (!onboardingStatus?.onboardingCompleted) {
    return <OnboardingFlow onComplete={() => {/* query invalidation через queryClient если нужно */}} />;
  }

  return <MainShell />;
}

function MainShell() {
  const [tab, setTab] = useState<NavTab>('deck');

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col">
      <main className="flex min-h-0 flex-1 flex-col px-3 pt-3">
        {tab === 'deck' && <SwipeDeck />}
        {tab === 'chat' && <ChatView />}
        {tab === 'profile' && <ProfileView />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-3">
        <span className="text-6xl" aria-hidden>🏠</span>
        <h1 className="text-3xl font-bold tracking-tight text-(--text)">roomies</h1>
        <div className="mt-3 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
