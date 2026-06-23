'use client';

import { useState } from 'react';
import { haptic } from '@/shared/lib/telegram';
import { Button } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/chip';
import type {
  DealbreakersPayload,
  GuestsPreference,
  OnboardingState,
} from '../../model/types';

interface DealbreakersStepProps {
  state: OnboardingState;
  onSubmit: (payload: DealbreakersPayload) => void;
}

const GUESTS_OPTIONS: { value: GuestsPreference; label: string }[] = [
  { value: 'often', label: 'Часто' },
  { value: 'sometimes', label: 'Иногда' },
  { value: 'rarely', label: 'Редко' },
];

export function DealbreakersStep({ state, onSubmit }: DealbreakersStepProps) {
  const [smokingOk, setSmokingOk] = useState(state.answers.smokingOk);
  const [petsOk, setPetsOk] = useState(state.answers.petsOk);
  const [guestsPref, setGuestsPref] = useState<GuestsPreference>(
    state.answers.guestsPref,
  );

  function handleSubmit() {
    onSubmit({ smokingOk, petsOk, guestsPref });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-black text-(--text)">
          Что для тебя важно?
        </h1>
        <p className="mt-2 text-base text-muted">Это влияет на совместимость</p>
      </div>

      <div className="flex flex-col gap-5">
        <Field label="Курение">
          <Chip active={!smokingOk} onClick={() => { haptic('light'); setSmokingOk(false); }}>
            🚭 Не курю
          </Chip>
          <Chip active={smokingOk} onClick={() => { haptic('light'); setSmokingOk(true); }}>
            🚬 Курение ок
          </Chip>
        </Field>

        <Field label="Питомцы">
          <Chip active={petsOk} onClick={() => { haptic('light'); setPetsOk(true); }}>
            🐾 Есть питомцы
          </Chip>
          <Chip active={!petsOk} onClick={() => { haptic('light'); setPetsOk(false); }}>
            🚫 Без питомцев
          </Chip>
        </Field>

        <Field label="Гости">
          {GUESTS_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={guestsPref === opt.value}
              onClick={() => { haptic('light'); setGuestsPref(opt.value); }}
            >
              {opt.label}
            </Chip>
          ))}
        </Field>
      </div>

      <div className="mt-auto">
        <Button
          loading={state.loading}
          onClick={handleSubmit}
          className="h-14 w-full text-base"
        >
          Продолжить
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
