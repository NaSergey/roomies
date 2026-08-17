'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOnboarding } from '../model/use-onboarding';
import type { StepDirection } from '../model/types';
import { BudgetStep } from './steps/BudgetStep';
import { DealbreakersStep } from './steps/DealbreakersStep';
import { DoneStep } from './steps/DoneStep';
import { LocationStep } from './steps/LocationStep';
import { ProfileStep } from './steps/ProfileStep';
import { ScenarioStep } from './steps/ScenarioStep';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Шагов с вопросами 5 (0..4); DoneStep — финальный экран, в счётчик не входит.
const TOTAL_STEPS = 5;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const {
    state,
    goToStep,
    saveDraft,
    clearError,
    submitScenario,
    submitLocation,
    submitBudget,
    submitDealbreakers,
    submitProfile,
    onComplete: completeOnboarding,
  } = useOnboarding();

  // Ошибка относится к конкретной попытке отправки. Без автоснятия она висела
  // поверх анкеты до следующего submit — в том числе на других вопросах.
  useEffect(() => {
    if (!state.error) return;
    const timer = setTimeout(clearError, 5000);
    return () => clearTimeout(timer);
  }, [state.error, clearError]);

  // Fire onComplete immediately when state.onboardingCompleted becomes true
  // (e.g. returning user who already finished onboarding)
  useEffect(() => {
    if (state.onboardingCompleted) {
      onComplete();
    }
  }, [state.onboardingCompleted, onComplete]);

  const handleDoneComplete = useCallback(() => {
    completeOnboarding();
    onComplete();
  }, [completeOnboarding, onComplete]);

  // Сторона, с которой выезжает следующий вопрос. Ставим в тех двух местах, где
  // шаг реально меняется по воле пользователя: «назад» — влево, отправка шага —
  // вправо. Восстановление прогресса при входе оставляет значение по умолчанию
  // (вправо), и это верно: анкета продолжается вперёд.
  const [direction, setDirection] = useState<StepDirection>('forward');

  // На первом шаге стрелка «назад» неактивна — уходить некуда.
  const back =
    state.step > 0
      ? () => {
          setDirection('back');
          goToStep(state.step - 1);
        }
      : undefined;

  // Любой submit — это движение вперёд. Оборачиваем здесь, а не в каждом шаге:
  // шагу незачем знать про анимацию соседей.
  function forward<T>(submit: (payload: T) => void) {
    return (payload: T) => {
      setDirection('forward');
      submit(payload);
    };
  }

  function renderStep() {
    const common = {
      state,
      totalSteps: TOTAL_STEPS,
      onBack: back,
      direction,
      onDraft: saveDraft,
    };
    switch (state.step) {
      case 0:
        return <ScenarioStep {...common} step={1} onSubmit={forward(submitScenario)} />;
      case 1:
        return <LocationStep {...common} step={2} onSubmit={forward(submitLocation)} />;
      case 2:
        return <BudgetStep {...common} step={3} onSubmit={forward(submitBudget)} />;
      case 3:
        return (
          <DealbreakersStep {...common} step={4} onSubmit={forward(submitDealbreakers)} />
        );
      case 4:
        return <ProfileStep {...common} step={5} onSubmit={forward(submitProfile)} />;
      case 5:
        return <DoneStep onComplete={handleDoneComplete} />;
      default:
        return null;
    }
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-md flex-col">
      {state.error && (
        <div
          role="alert"
          className="fixed left-4 right-4 top-4 z-50 rounded-2xl border-glass backdrop-glass shadow-glass bg-[rgba(255,217,224,0.35)] px-4 py-3 text-sm font-bold text-(--text)"
        >
          {state.error}
        </div>
      )}

      {/* Без key: шаги — разные компоненты, React и так пересоздаёт поддерево
          при смене шага. Ключ здесь лишь заставлял пересоздавать ещё и эту
          обёртку, а анимацией занимается OnboardingLayout (у него свой key). */}
      <div className="flex min-h-0 flex-1 flex-col">{renderStep()}</div>
    </main>
  );
}
