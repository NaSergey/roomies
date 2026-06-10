'use client';

import { useState } from 'react';
import { haptic } from '@/shared/lib/telegram';
import type { OnboardingState, ScenarioType } from '../../model/types';

interface ScenarioStepProps {
  state: OnboardingState;
  onSubmit: (scenario: ScenarioType) => void;
}

const SCENARIOS: {
  scenario: ScenarioType;
  emoji: string;
  title: string;
  subtitle: string;
}[] = [
  {
    scenario: 'looking_housing_roomie',
    emoji: '🏠',
    title: 'Ищу жильё и соседа',
    subtitle: 'Нет квартиры, нужен кто-то рядом',
  },
  {
    scenario: 'has_housing_seeking_roomie',
    emoji: '🔑',
    title: 'У меня есть жильё',
    subtitle: 'Ищу соседа на свою площадь',
  },
  {
    scenario: 'looking_roomie_find_housing',
    emoji: '🤝',
    title: 'Ищем вместе',
    subtitle: 'Уже есть сосед, ищем квартиру',
  },
  {
    scenario: 'squad',
    emoji: '👥',
    title: 'Собираем команду',
    subtitle: 'Сквад на 2–4 человека',
  },
];

export function ScenarioStep({ state, onSubmit }: ScenarioStepProps) {
  const [selected, setSelected] = useState<ScenarioType | null>(
    state.answers.scenario,
  );

  function handleSelect(scenario: ScenarioType) {
    haptic('light');
    setSelected(scenario);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text)">
          Ты ищешь или уже нашёл жильё?
        </h1>
        <p className="mt-2 text-base text-(--text-muted)">
          Выбери свой сценарий
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SCENARIOS.map((item) => {
          const isSelected = selected === item.scenario;
          return (
            <button
              key={item.scenario}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(item.scenario)}
              className={`flex items-center gap-3 rounded-2xl bg-surface px-4 py-4 text-left transition-transform active:scale-[0.98] ${isSelected ? 'ring-2 ring-accent' : ''}`}
              style={{ boxShadow: 'var(--shadow-button)' }}
            >
              <span className="text-3xl" aria-hidden="true">
                {item.emoji}
              </span>
              <div className="flex flex-1 flex-col">
                <span className="text-base font-semibold text-(--text)">
                  {item.title}
                </span>
                <span className="text-sm text-(--text-muted)">
                  {item.subtitle}
                </span>
              </div>
              {isSelected && (
                <span className="ml-auto" aria-hidden="true">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-accent"
                  >
                    <polyline points="3 8 6.5 11.5 13 4.5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto">
        <button
          type="button"
          disabled={!selected || state.loading}
          onClick={() => selected && onSubmit(selected)}
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
