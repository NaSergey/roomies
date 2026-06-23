'use client';

import { useState } from 'react';
import { haptic } from '@/shared/lib/telegram';
import { Button } from '@/shared/ui/Button';
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
        <h1 className="text-2xl font-black text-(--text)">
          Ты ищешь или уже нашёл жильё?
        </h1>
        <p className="mt-2 text-base text-muted">
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
              className={`flex items-center gap-3 rounded-2xl border-2 border-black px-4 py-4 text-left shadow-[2px_2px_0_rgba(20,20,15,0.9)] transition-all duration-100 active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] ${isSelected ? 'bg-accent' : 'bg-white'}`}
            >
              <span className="text-3xl" aria-hidden="true">
                {item.emoji}
              </span>
              <div className="flex flex-1 flex-col">
                <span className="text-base font-black text-(--text)">
                  {item.title}
                </span>
                <span className="text-sm text-muted">
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
                    className="text-[#14140f]"
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
        <Button
          loading={state.loading}
          disabled={!selected}
          onClick={() => selected && onSubmit(selected)}
          className="h-14 w-full text-base"
        >
          Продолжить
        </Button>
      </div>
    </div>
  );
}
