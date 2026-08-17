'use client';

import { useState } from 'react';
import type { ScenarioType, StepChromeProps } from '../../model/types';
import { OnboardingLayout } from '../OnboardingLayout';
import { RadioRow } from '../RadioRow';

interface ScenarioStepProps extends StepChromeProps {
  onSubmit: (scenario: ScenarioType) => void;
}

const SCENARIOS: { scenario: ScenarioType; title: string; hint: string }[] = [
  {
    scenario: 'looking_housing_roomie',
    title: 'Ищу жильё и соседа',
    hint: '(нет квартиры, нужен кто-то рядом)',
  },
  {
    scenario: 'has_housing_seeking_roomie',
    title: 'У меня есть жильё',
    hint: '(ищу соседа на свою площадь)',
  },
  {
    scenario: 'looking_roomie_find_housing',
    title: 'Ищем вместе',
    hint: '(уже есть сосед, ищем квартиру)',
  },
  {
    scenario: 'squad',
    title: 'Собираем команду',
    hint: '(сквад на 2–4 человека)',
  },
];

export function ScenarioStep({
  state,
  step,
  totalSteps,
  onSubmit,
  onBack,
  onDraft,
  direction,
}: ScenarioStepProps) {
  const [selected, setSelected] = useState<ScenarioType | null>(
    state.answers.scenario,
  );

  const handleBack =
    onBack &&
    (() => {
      onDraft?.({ scenario: selected });
      onBack();
    });

  return (
    <OnboardingLayout
      step={step}
      totalSteps={totalSteps}
      title="Ты ищешь или уже нашёл жильё?"
      onBack={handleBack}
      direction={direction}
      onNext={() => selected && onSubmit(selected)}
      canGoNext={Boolean(selected)}
      loading={state.loading}
    >
      <div role="radiogroup" className="flex flex-col gap-2">
        {SCENARIOS.map((item) => (
          <RadioRow
            key={item.scenario}
            selected={selected === item.scenario}
            onSelect={() => setSelected(item.scenario)}
            label={item.title}
            hint={item.hint}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}
