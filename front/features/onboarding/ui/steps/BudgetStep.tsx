'use client';

import { useState } from 'react';
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
        <h1 className="text-2xl font-bold text-(--text)">
          Какой у тебя бюджет?
        </h1>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted">от, ₽</label>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="20 000"
              className="h-14 w-full rounded-2xl bg-surface px-4 text-center text-base text-(--text)"
              style={{ boxShadow: 'var(--shadow-button)' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted">до, ₽</label>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="50 000"
              className="h-14 w-full rounded-2xl bg-surface px-4 text-center text-base text-(--text)"
              style={{ boxShadow: 'var(--shadow-button)' }}
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
        <p className="text-base font-semibold text-(--text)">
          Когда планируешь?
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-(--text-muted)">
            Дата въезда
          </label>
          <input
            type="date"
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
            className="h-14 w-full rounded-2xl bg-surface px-4 text-base text-(--text)"
            style={{ boxShadow: 'var(--shadow-button)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-(--text-muted)">
            Срок проживания
          </label>
          <div className="relative">
            <select
              value={stayDuration}
              onChange={(e) => setStayDuration(e.target.value)}
              className="h-14 w-full appearance-none rounded-2xl bg-surface px-4 text-base text-(--text)"
              style={{ boxShadow: 'var(--shadow-button)' }}
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
                className="text-(--text-muted)"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
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
