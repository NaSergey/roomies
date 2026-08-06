'use client';

import type { ReactNode } from 'react';
import { haptic } from '@/shared/lib/telegram';
import { KeyIcon } from '@/shared/ui/icon/KeyIcon';

interface OnboardingLayoutProps {
  /** Номер шага с 1. */
  step: number;
  totalSteps: number;
  title: string;
  /** Необязательный подзаголовок под вопросом. */
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  /** Стрелка «вперёд» гаснет, пока шаг не заполнен. */
  canGoNext?: boolean;
  loading?: boolean;
}

// Единый каркас всех опросных экранов (шаги онбординга + вайб-квиз):
// ключи по краям шапки, счётчик шагов, вопрос по центру, внизу — стрелки
// и заполненность профиля. Раньше каждый шаг рисовал свой заголовок слева
// и свою кнопку «Продолжить» внизу.
export function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  canGoNext = true,
  loading = false,
}: OnboardingLayoutProps) {
  // Процент — заполненность анкеты: доля уже пройденных шагов.
  const percent = Math.round(((step - 1) / totalSteps) * 100);

  return (
    <div
      className="flex h-full flex-col"
      // Семейство задаём на корне экрана — наследуется всем содержимым,
      // включая шаги, которые рендерятся через children.
      style={{
        paddingTop: '1.5rem',
        paddingBottom: '1.5rem',
        fontFamily: 'var(--font-quiz)',
      }}
    >
      {/* Шапка: ключи по краям, счётчик по центру */}
      <div className="flex shrink-0 items-center justify-between px-6">
        <KeyIcon className="h-14 w-auto" />
        <span className="text-2xl font-black tabular-nums text-(--text-deep)">
          {step}/{totalSteps}
        </span>
        {/* Зеркалим правый ключ — пара читается симметрично. */}
        <KeyIcon className="h-14 w-auto -scale-x-100" />
      </div>

      {/* Тело шага */}
      {/* Горизонтальный паддинг именно ЗДЕСЬ, а не на внешнем контейнере:
          overflow-y-auto обрезает содержимое и по горизонтали тоже, поэтому
          свечение кружков (box-shadow выходит за габарит) срезалось у левого
          края. Внутри padding-box скроллпорта оно помещается целиком. */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-8 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
        <div className="shrink-0 text-center">
          <h1 className="text-2xl font-black leading-snug text-balance text-(--text-deep)">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-(--text-deep) opacity-65">{subtitle}</p>
          )}
        </div>

        {children}
      </div>

      {/* Низ: стрелки + заполненность. На стеклянной пилюле, потому что низ
          экрана приходится на тёмную часть фона (--bg) и тёмный текст там
          иначе не читается — тот же приём, что в BottomNav. */}
      <div className="mx-6 flex shrink-0 items-center justify-between gap-4 rounded-full border-glass bg-glass backdrop-glass px-6 py-3 shadow-glass">
        <button
          type="button"
          onClick={() => {
            if (!onBack) return;
            haptic('light');
            onBack();
          }}
          disabled={!onBack}
          aria-label="Назад"
          className="p-1 text-(--text-deep) transition-all duration-150 active:scale-90 disabled:opacity-25"
        >
          <NavArrow dir="left" />
        </button>

        <span className="text-3xl font-black tabular-nums text-(--text-deep)">
          {percent}%
        </span>

        <button
          type="button"
          onClick={() => {
            if (!canGoNext || loading) return;
            haptic('light');
            onNext();
          }}
          disabled={!canGoNext || loading}
          aria-label="Далее"
          className="p-1 text-(--text-deep) transition-all duration-150 active:scale-90 disabled:opacity-25"
        >
          {loading ? (
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          ) : (
            <NavArrow dir="right" />
          )}
        </button>
      </div>
    </div>
  );
}

function NavArrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="34"
      height="20"
      viewBox="0 0 34 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={dir === 'left' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M2 10h30M24 2l8 8-8 8" />
    </svg>
  );
}
