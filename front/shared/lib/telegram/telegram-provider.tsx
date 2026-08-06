'use client';

import { AnimatedGradientBackground } from '@/shared/ui/AnimatedGradientBackground';
import { useTelegramWebApp } from './use-telegram-web-app';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useTelegramWebApp();
  // Контейнер на высоту экрана. Safe-area (вырез/шапка TG сверху, домашняя
  // полоса снизу) — это padding ВНУТРИ h-dvh (border-box), поэтому контент не
  // вылезает за экран в fullscreen. Вьюхи внутри занимают h-full.
  //
  // Фон смонтирован ЗДЕСЬ, один раз, выше всех вкладок/экранов — единственный
  // источник фона для всего приложения, не переключается и не пересоздаётся
  // при навигации (см. AnimatedGradientBackground).
  return (
    <div className="flex h-dvh flex-col overflow-hidden pt-[var(--tg-safe-top,0px)] pb-[env(safe-area-inset-bottom)]">
      <AnimatedGradientBackground />
      {children}
    </div>
  );
}
