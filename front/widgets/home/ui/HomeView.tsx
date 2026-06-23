'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTelegramAuth } from '@/features/auth';
import { OnboardingFlow, getOnboardingStatus } from '@/features/onboarding';
import { feedKeys } from '@/features/swipe-profile';
import { profileKeys } from '@/features/profile';
import { chatKeys } from '@/features/chat';
import { getFeed, getMe, getMatches } from '@/shared/lib/api';
import { Loader } from '@/shared/ui/loader';
import { BottomNav, type NavTab } from '@/widgets/bottom-nav';
import { ChatView } from '@/widgets/chat';
import { ProfileView } from '@/widgets/profile';
import { SwipeDeck } from '@/widgets/swipe-deck';

export function HomeView() {
  const auth = useTelegramAuth();
  const queryClient = useQueryClient();

  const { data: onboardingStatus, isPending, isError } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: getOnboardingStatus,
    enabled: auth.status === 'authenticated',
    staleTime: Infinity, // статус меняется только после прохождения онбординга
  });

  // Прогреваем ленту СРАЗУ после авторизации — параллельно с запросом
  // onboarding-status. К моменту, когда отрисуется SwipeDeck, карточки уже
  // в кэше: пользователь не видит второй спиннер «загрузка карточек».
  useEffect(() => {
    if (auth.status !== 'authenticated') return;
    void queryClient.prefetchQuery({
      queryKey: feedKeys.all,
      queryFn: () => getFeed(),
      staleTime: 5 * 60 * 1000,
    });
  }, [auth.status, queryClient]);

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

  // Статус не загрузился (напр. токен протух и был вычищен на 401) — НЕ проваливаемся
  // в онбординг без токена, а показываем перезагрузку: следующий старт перелогинится.
  if (isError) {
    return (
      <main className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-3xl">⚠️</p>
        <p className="text-sm text-muted">Не удалось загрузить профиль. Перезапусти приложение.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border-2 border-black bg-accent px-5 py-2 text-sm font-black text-(--text-on-accent) shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] transition-all duration-100"
        >
          Перезагрузить
        </button>
      </main>
    );
  }

  if (!onboardingStatus?.onboardingCompleted) {
    return <OnboardingFlow onComplete={() => {/* query invalidation через queryClient если нужно */}} />;
  }

  return <MainShell />;
}

function MainShell() {
  const [tab, setTab] = useState<NavTab>('deck');
  const queryClient = useQueryClient();

  // Пользователь на ленте карточек — в фоне прогреваем профиль и список чатов,
  // чтобы при переходе на эти вкладки данные были уже готовы (без спиннера).
  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: profileKeys.me,
      queryFn: getMe,
      staleTime: Infinity,
    });
    void queryClient.prefetchQuery({
      queryKey: chatKeys.matches,
      queryFn: getMatches,
      staleTime: 30_000,
    });
  }, [queryClient]);

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
        <Loader className="mt-3" />
      </div>
    </div>
  );
}
