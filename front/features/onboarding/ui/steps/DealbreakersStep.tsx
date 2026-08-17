'use client';

import { useState } from 'react';
import type {
  DealbreakersPayload,
  GuestsPreference,
  StepChromeProps,
} from '../../model/types';
import { OnboardingLayout } from '../OnboardingLayout';
import { RadioRow } from '../RadioRow';

interface DealbreakersStepProps extends StepChromeProps {
  onSubmit: (payload: DealbreakersPayload) => void;
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
  onDraft,
  direction,
}: DealbreakersStepProps) {
  // Про себя и про соседа — РАЗНЫЕ вопросы. Пока это была одна галочка,
  // «отношусь спокойно» уезжало на бэк как «курю», и матчинг разводил двоих
  // некурящих только потому, что один из них терпимее другого.
  const [smokes, setSmokes] = useState(state.answers.smokes);
  const [smokingOk, setSmokingOk] = useState(state.answers.smokingOk);
  const [hasPets, setHasPets] = useState(state.answers.hasPets);
  const [petsOk, setPetsOk] = useState(state.answers.petsOk);
  const [guestsPref, setGuestsPref] = useState<GuestsPreference>(
    state.answers.guestsPref,
  );

  const handleBack =
    onBack &&
    (() => {
      onDraft?.({ smokingOk, petsOk, smokes, hasPets, guestsPref });
      onBack();
    });

  return (
    <OnboardingLayout
      step={step}
      totalSteps={totalSteps}
      title="Что для тебя важно?"
      subtitle="Это влияет на совместимость"
      onBack={handleBack}
      direction={direction}
      onNext={() => onSubmit({ smokingOk, petsOk, smokes, hasPets, guestsPref })}
      loading={state.loading}
    >
      <Group label="Куришь?">
        <RadioRow
          selected={!smokes}
          onSelect={() => setSmokes(false)}
          label="Не курю"
        />
        <RadioRow
          selected={smokes}
          onSelect={() => setSmokes(true)}
          label="Курю"
        />
      </Group>

      <Group label="А если курит сосед?">
        <RadioRow
          selected={smokingOk}
          onSelect={() => setSmokingOk(true)}
          label="Нормально"
          hint="(отношусь спокойно)"
        />
        <RadioRow
          selected={!smokingOk}
          onSelect={() => setSmokingOk(false)}
          label="Не хочу"
          hint="(ищу некурящего)"
        />
      </Group>

      <Group label="Есть питомец?">
        <RadioRow
          selected={hasPets}
          onSelect={() => setHasPets(true)}
          label="Есть"
        />
        <RadioRow
          selected={!hasPets}
          onSelect={() => setHasPets(false)}
          label="Нет"
        />
      </Group>

      <Group label="А если питомец у соседа?">
        <RadioRow
          selected={petsOk}
          onSelect={() => setPetsOk(true)}
          label="Нормально"
          hint="(люблю животных)"
        />
        <RadioRow
          selected={!petsOk}
          onSelect={() => setPetsOk(false)}
          label="Не хочу"
          hint="(аллергия или не готов)"
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
