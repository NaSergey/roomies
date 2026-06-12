'use client';

import { useState } from 'react';
import { haptic } from '@/shared/lib/telegram';
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
  { value: 'rarely', label: 'Редко' },
  { value: 'sometimes', label: 'Иногда' },
  { value: 'often', label: 'Часто' },
];

export function DealbreakersStep({ state, onSubmit }: DealbreakersStepProps) {
  const [smokingOk, setSmokingOk] = useState(state.answers.smokingOk);
  const [petsOk, setPetsOk] = useState(state.answers.petsOk);
  const [guestsOn, setGuestsOn] = useState(
    state.answers.guestsPref !== 'rarely',
  );
  const [guestsPref, setGuestsPref] = useState<GuestsPreference>(
    state.answers.guestsPref === 'rarely' ? 'sometimes' : state.answers.guestsPref,
  );

  function handleGuestsToggle() {
    haptic('light');
    if (!guestsOn) {
      setGuestsPref('sometimes');
    }
    setGuestsOn((prev) => !prev);
  }

  function handleSubmit() {
    onSubmit({
      smokingOk,
      petsOk,
      guestsPref: guestsOn ? guestsPref : 'rarely',
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text)">
          Что для тебя важно?
        </h1>
        <p className="mt-2 text-base text-(--text-muted)">
          Это влияет на совместимость
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Smoking toggle */}
        <ToggleRow
          emoji="🚬"
          label="Курение окей"
          checked={smokingOk}
          onChange={() => {
            haptic('light');
            setSmokingOk((prev) => !prev);
          }}
        />

        {/* Pets toggle */}
        <ToggleRow
          emoji="🐾"
          label="Питомцы окей"
          checked={petsOk}
          onChange={() => {
            haptic('light');
            setPetsOk((prev) => !prev);
          }}
        />

        {/* Guests toggle + sub-selector */}
        <div>
          <ToggleRow
            emoji="🎉"
            label="Гости бывают"
            checked={guestsOn}
            onChange={handleGuestsToggle}
          />
          <div
            style={{
              maxHeight: guestsOn ? '60px' : '0',
              overflow: 'hidden',
              transition: 'max-height 200ms ease-in-out',
            }}
          >
            <div className="flex gap-2 pt-3 pb-1 px-1">
              {GUESTS_OPTIONS.map((opt) => {
                const isSelected = guestsPref === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      haptic('light');
                      setGuestsPref(opt.value);
                    }}
                    className={`min-h-[36px] rounded-full px-4 text-sm font-medium text-(--text) transition-colors ${isSelected ? 'bg-accent text-(--text-on-accent)' : 'bg-surface'}`}
                    style={{ boxShadow: 'var(--shadow-button)' }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <button
          type="button"
          disabled={state.loading}
          onClick={handleSubmit}
          className="h-14 w-full rounded-2xl bg-accent text-base font-semibold text-(--text-on-accent) transition-transform active:scale-[0.97] disabled:opacity-50"
        >
          {state.loading ? (
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          ) : (
            'Продолжить'
          )}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  emoji,
  label,
  checked,
  onChange,
}: {
  emoji: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-4"
      style={{ boxShadow: 'var(--shadow-button)' }}
    >
      <div className="flex items-center">
        <span className="text-xl" aria-hidden="true">
          {emoji}
        </span>
        <span className="ml-3 text-base font-medium text-(--text)">{label}</span>
      </div>
      <div
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
        style={{ background: checked ? 'var(--accent)' : 'var(--surface-2)' }}
      >
        <span
          className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0px)' }}
        />
      </div>
    </button>
  );
}
