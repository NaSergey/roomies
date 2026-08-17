'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EmailAuthForm, useAppAuth } from '@/features/auth';
import {
  OnboardingFlow,
  getOnboardingStatus,
  onboardingKeys,
  type OnboardingStatus,
} from '@/features/onboarding';
import { useFeedQuery } from '@/features/swipe-profile';
import { profileKeys } from '@/features/profile';
import { chatKeys } from '@/features/chat';
import { squadKeys } from '@/features/squad';
import { getDistricts, getMe, getMatches, getSquadFeed } from '@/shared/lib/api';
import { geoKeys, DEFAULT_CITY_ID } from '@/shared/lib/query';
import { Loader } from '@/shared/ui/Loader';
import { BottomNav, type NavTab } from '@/widgets/bottom-nav';
import { ChatView } from '@/widgets/chat';
import { ProfileView } from '@/widgets/profile';
import { SwipeDeck } from '@/widgets/swipe-deck';

// Ключ общий с самой анкетой: она восстанавливает прогресс из этого же кэша,
// поэтому литерал вынесен в features/onboarding (см. onboardingKeys).
const ONBOARDING_STATUS_KEY = onboardingKeys.status;

export function HomeView() {
  const auth = useAppAuth();
  const queryClient = useQueryClient();

  const { data: onboardingStatus, isPending, isError } = useQuery({
    queryKey: ONBOARDING_STATUS_KEY,
    queryFn: getOnboardingStatus,
    enabled: auth.status === 'authenticated',
    staleTime: Infinity, // статус меняется только после прохождения онбординга
  });

  // Финал онбординга. Бэкенд ставит onboardingCompleted при сохранении профиля
  // (onboarding.service.ts saveProfile), но запрос статуса — staleTime: Infinity,
  // поэтому в кэше всё ещё лежит false и HomeView продолжил бы рендерить
  // OnboardingFlow: кнопка «Смотреть анкеты» выглядела бы нерабочей. Правим кэш
  // сразу (мгновенный переход на ленту, без промежуточного спиннера) и следом
  // инвалидируем — сервер подтвердит.
  const handleOnboardingComplete = useCallback(() => {
    queryClient.setQueryData<OnboardingStatus>(ONBOARDING_STATUS_KEY, (prev) =>
      prev ? { ...prev, onboardingCompleted: true } : prev,
    );
    void queryClient.invalidateQueries({ queryKey: ONBOARDING_STATUS_KEY });
  }, [queryClient]);

  // Лента грузится сразу, как только известно, что онбординг пройден — и это не
  // prefetch, а полноценный запрос: его статус нужен прямо здесь, чтобы не
  // снимать заставку раньше времени (см. ниже про два спиннера). Ключ тот же,
  // что у SwipeDeck (feedKeys.all), поэтому там данные уже в кэше.
  //
  // Ждём именно onboardingCompleted, а не только авторизацию: до конца анкеты
  // GET /feed отвечает 403 («Complete onboarding to access the feed»), и
  // новичок гарантированно получал два провальных запроса на старте.
  const feed = useFeedQuery(
    undefined,
    auth.status === 'authenticated' && onboardingStatus?.onboardingCompleted === true,
  );

  if (auth.status === 'unauthenticated') {
    return (
      <EmailAuthForm
        loading={auth.submitting}
        error={auth.error}
        onLogin={auth.login}
        onRegister={auth.register}
        onTelegramLogin={auth.loginViaTelegram}
        onClearError={auth.clearError}
      />
    );
  }

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
          className="rounded-full border-glass bg-accent-glass backdrop-glass px-5 py-2 text-sm font-black text-(--text-on-accent) shadow-glass active:scale-95 transition-transform duration-150"
        >
          Перезагрузить
        </button>
      </main>
    );
  }

  if (!onboardingStatus?.onboardingCompleted) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Держим ту же заставку, пока не приехали анкеты. Без этого пользователь видел
  // ДВЕ загрузки подряд: onboarding-status — лёгкий запрос и возвращается заметно
  // раньше ленты (та тянет сотню кандидатов и считает по ним скоринг), поэтому
  // заставка снималась, показывался MainShell, и SwipeDeck тут же рисовал свой
  // спиннер «загрузка карточек». Проверка стоит ПОСЛЕ ветки онбординга: новичку
  // лента не нужна, ждать её на входе он не должен.
  // isPending, а не isLoading: при ошибке ленты заставка снимается, и SwipeDeck
  // покажет свой экран ошибки с кнопкой «Повторить», а не висит вечно.
  if (feed.isPending) {
    return <SplashScreen />;
  }

  return <MainShell />;
}

function MainShell() {
  const [tab, setTab] = useState<NavTab>('deck');
  const queryClient = useQueryClient();

  // Пользователь на ленте карточек — в фоне прогреваем профиль и список чатов,
  // чтобы при переходе на эти вкладки данные были уже готовы (без спиннера).
  // Справочник районов — сюда же: он нужен шторке фильтров, и без прогрева
  // чипы районов приезжали уже после того, как панель выехала, толкая её вверх.
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
    void queryClient.prefetchQuery({
      queryKey: geoKeys.districts(DEFAULT_CITY_ID),
      queryFn: () => getDistricts(DEFAULT_CITY_ID),
      staleTime: Infinity,
    });
    // Лента показывает сквады отдельной полосой ПОД колодой, условно по
    // непустому списку: без прогрева полоса возникала уже после отрисовки
    // экрана и сдвигала раскладку под собой.
    void queryClient.prefetchQuery({
      queryKey: squadKeys.feed,
      queryFn: getSquadFeed,
      staleTime: 60_000,
    });
  }, [queryClient]);

  return (
    // relative — под плавающую навигацию: она вынута из потока и лежит поверх
    // вкладки, чтобы контент проезжал под стеклом, а не упирался в панель.
    // Место под неё вкладки резервируют своим нижним отступом (NAV_SPACE).
    <div className="relative mx-auto flex h-full w-full max-w-md flex-col">
      {/* Отступы намеренно НЕ здесь, а внутри каждой вкладки. Снаружи они
          прижимали содержимое к краю скроллящегося контейнера вкладки, и он
          срезал всё, что выходит за него — тени стеклянных карточек, аватаров,
          кнопок обрубались ровной вертикальной линией по краю экрана. */}
      <main className="flex min-h-0 flex-1 flex-col">
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
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-6xl" aria-hidden>🏠</span>
        <h1 className="text-3xl font-bold tracking-tight text-(--text)">roomies</h1>
        <Loader className="mt-3" />
      </div>
    </div>
  );
}
