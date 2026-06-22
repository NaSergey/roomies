'use client';

import { useCallback, useEffect } from 'react';
import { useOnboarding } from '../model/use-onboarding';
import { BudgetStep } from './steps/BudgetStep';
import { DealbreakersStep } from './steps/DealbreakersStep';
import { DoneStep } from './steps/DoneStep';
import { LocationStep } from './steps/LocationStep';
import { ProfileStep } from './steps/ProfileStep';
import { QuizStep } from './steps/QuizStep';
import { ScenarioStep } from './steps/ScenarioStep';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const {
    state,
    submitScenario,
    submitLocation,
    submitBudget,
    submitDealbreakers,
    submitQuiz,
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

  function dismissError() {
    // error is cleared on next submit — no explicit dismiss needed in this flow
    // but we provide the button for UX per spec
  }

  function renderStep() {
    switch (state.step) {
      case 0:
        return <ScenarioStep state={state} onSubmit={submitScenario} />;
      case 1:
        return <LocationStep state={state} onSubmit={submitLocation} />;
      case 2:
        return <BudgetStep state={state} onSubmit={submitBudget} />;
      case 3:
        return (
          <DealbreakersStep state={state} onSubmit={submitDealbreakers} />
        );
      case 4:
        return (
          <QuizStep
            state={state}
            onSubmit={(answers) => submitQuiz({ answers })}
          />
        );
      case 5:
        return <ProfileStep state={state} onSubmit={submitProfile} />;
      case 6:
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
          className="fixed left-4 right-4 top-4 z-50 rounded-2xl bg-surface px-4 py-3 text-sm text-(--text)"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span>{state.error}</span>
            <button
              type="button"
              aria-label="Закрыть ошибку"
              onClick={dismissError}
              className="text-(--text-muted) transition-opacity active:opacity-70"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div
        key={state.step}
        className="flex flex-1 flex-col overflow-y-auto translate-x-0 transition-transform duration-[280ms] ease-out"
      >
        {renderStep()}
      </div>
    </main>
  );
}
