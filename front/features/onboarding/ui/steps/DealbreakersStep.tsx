'use client';

import { useState } from 'react';
import type {
  DealbreakersPayload,
  GuestsPreference,
  OnboardingState,
} from '../../model/types';
import { OnboardingLayout } from '../OnboardingLayout';
import { RadioRow } from '../RadioRow';

interface DealbreakersStepProps {
  state: OnboardingState;
  step: number;
  totalSteps: number;
  onSubmit: (payload: DealbreakersPayload) => void;
  onBack?: () => void;
}

const GUESTS_OPTIONS: { value: GuestsPreference; label: string; hint: string }[] = [
  { value: 'often', label: 'Часто', hint: '(почти каждую неделю)' },
  { value: 'sometimes', label: 'Иногда', hint: '(пару раз в месяц)' },
  { value: 'rarely', label: 'Редко', hint: '(предпочитаю без гостей)' },
];

export function DealbreakersStep({
  state,
  step,
  totalSteps,
  onSubmit,
  onBack,
}: DealbreakersStepProps) {
  const [smokingOk, setSmokingOk] = useState(state.answers.smokingOk);
  const [petsOk, setPetsOk] = useState(state.answers.petsOk);
  const [guestsPref, setGuestsPref] = useState<GuestsPreference>(
    state.answers.guestsPref,
  );

  return (
    <OnboardingLayout
      step={step}
      totalSteps={totalSteps}
      title="Что для тебя важно?"
      subtitle="Это влияет на совместимость"
      onBack={onBack}
      onNext={() => onSubmit({ smokingOk, petsOk, guestsPref })}
      loading={state.loading}
    >
      <Group label="Курение">
        <RadioRow
          selected={!smokingOk}
          onSelect={() => setSmokingOk(false)}
          label="Не курю"
          hint="(и рядом тоже не хочу)"
        />
        <RadioRow
          selected={smokingOk}
          onSelect={() => setSmokingOk(true)}
          label="Курение ок"
          hint="(отношусь спокойно)"
        />
      </Group>

      <Group label="Питомцы">
        <RadioRow
          selected={petsOk}
          onSelect={() => setPetsOk(true)}
          label="Питомцы ок"
          hint="(есть свои или не против)"
        />
        <RadioRow
          selected={!petsOk}
          onSelect={() => setPetsOk(false)}
          label="Без питомцев"
          hint="(аллергия или не хочу)"
        />
      </Group>

      <Group label="Гости">
        {GUESTS_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.value}
            selected={guestsPref === opt.value}
            onSelect={() => setGuestsPref(opt.value)}
            label={opt.label}
            hint={opt.hint}
          />
        ))}
      </Group>
    </OnboardingLayout>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-(--text-deep) opacity-65">
        {label}
      </span>
      {children}
    </div>
  );
}
