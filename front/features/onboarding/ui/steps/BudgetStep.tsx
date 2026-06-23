'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { TextInput } from '@/shared/ui/TextInput';
import type { BudgetPayload, OnboardingState } from '../../model/types';

interface BudgetStepProps {
  state: OnboardingState;
  onSubmit: (payload: BudgetPayload) => void;
}

const DURATION_OPTIONS = [
  { value: '', label: 'Не знаю' },
  { value: '1', label: '1 месяц' },
  { value: '2', label: '2 месяца' },
  { value: '3', label: '3 месяца' },
  { value: '6', label: '6 месяцев' },
  { value: '12', label: '1 год' },
];

export function BudgetStep({ state, onSubmit }: BudgetStepProps) {
  const [budgetMin, setBudgetMin] = useState<string>(
    state.answers.budgetMin !== null ? String(state.answers.budgetMin) : '',
  );
  const [budgetMax, setBudgetMax] = useState<string>(
    state.answers.budgetMax !== null ? String(state.answers.budgetMax) : '',
  );
  const [moveInDate, setMoveInDate] = useState<string>(
    state.answers.moveInDate ?? '',
  );
  const [stayDuration, setStayDuration] = useState<string>(
    state.answers.stayDurationMonths !== null
      ? String(state.answers.stayDurationMonths)
      : '',
  );

  const minVal = budgetMin ? Number(budgetMin) : 0;
  const maxVal = budgetMax ? Number(budgetMax) : 0;
  const budgetError =
    minVal > 0 && maxVal > 0 && minVal > maxVal
      ? 'Минимальный бюджет не может быть больше максимального'
      : null;

  function handleSubmit() {
    onSubmit({
      budgetMin: minVal,
      budgetMax: maxVal,
      moveInDate: moveInDate || undefined,
      stayDurationMonths: stayDuration ? Number(stayDuration) : undefined,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-black text-(--text)">
          Какой у тебя бюджет?
        </h1>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-sm text-muted">от, ₽</label>
            <TextInput
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="20 000"
              className="h-14 w-full px-4 text-center text-base font-bold"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-sm text-muted">до, ₽</label>
            <TextInput
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="50 000"
              className="h-14 w-full px-4 text-center text-base font-bold"
            />
          </div>
        </div>
        {budgetError && (
          <p
            role="alert"
            className="mt-1 text-sm"
            style={{ color: 'var(--rose)' }}
          >
            {budgetError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-base font-black text-(--text)">Когда планируешь?</p>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-muted">Дата въезда</label>
          <TextInput
            type="date"
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
            className="h-14 px-4 text-base font-bold [color-scheme:light]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-muted">Срок проживания</label>
          <div className="relative">
            <select
              value={stayDuration}
              onChange={(e) => setStayDuration(e.target.value)}
              className="h-14 w-full min-w-0 appearance-none rounded-xl border-2 border-black bg-white px-4 pr-10 text-base font-bold text-(--text) outline-none"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
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
