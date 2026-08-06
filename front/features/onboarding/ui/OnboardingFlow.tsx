'use client';

import { useCallback, useEffect } from 'react';
import { useOnboarding } from '../model/use-onboarding';
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
    submitScenario,
    submitLocation,
    submitBudget,
    submitDealbreakers,
    submitProfile,
    onComplete: completeOnboarding,
  } = useOnboarding();

  const stableOnComplete = useCallback(onComplete, [onComplete]);

  // Fire onComplete immediately when state.onboardingCompleted becomes true
  // (e.g. returning user who already finished onboarding)
  useEffect(() => {
    if (state.onboardingCompleted) {
      stableOnComplete();
    }
  }, [state.onboardingCompleted, stableOnComplete]);

  const handleDoneComplete = useCallback(() => {
    completeOnboarding();
    stableOnComplete();
  }, [completeOnboarding, stableOnComplete]);

  // На первом шаге стрелка «назад» неактивна — уходить некуда.
  const back = state.step > 0 ? () => goToStep(state.step - 1) : undefined;

  function renderStep() {
    const common = { state, totalSteps: TOTAL_STEPS, onBack: back };
    switch (state.step) {
      case 0:
        return <ScenarioStep {...common} step={1} onSubmit={submitScenario} />;
      case 1:
        return <LocationStep {...common} step={2} onSubmit={submitLocation} />;
      case 2:
        return <BudgetStep {...common} step={3} onSubmit={submitBudget} />;
      case 3:
        return <DealbreakersStep {...common} step={4} onSubmit={submitDealbreakers} />;
      case 4:
        return <ProfileStep {...common} step={5} onSubmit={submitProfile} />;
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

      <div key={state.step} className="flex min-h-0 flex-1 flex-col">
        {renderStep()}
      </div>
    </main>
  );
}
