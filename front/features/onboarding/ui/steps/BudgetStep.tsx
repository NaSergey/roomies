'use client';

import { useState } from 'react';
import { haptic } from '@/shared/lib/telegram';
import { TextInput } from '@/shared/ui/TextInput';
import type { BudgetPayload, OnboardingState } from '../../model/types';
import { DateField } from '../DateField';
import { OnboardingLayout } from '../OnboardingLayout';
import { RadioRow } from '../RadioRow';

interface BudgetStepProps {
  state: OnboardingState;
  step: number;
  totalSteps: number;
  onSubmit: (payload: BudgetPayload) => void;
  onBack?: () => void;
}

const DURATION_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: '', label: 'Пока не знаю', hint: '(определюсь по ходу)' },
  { value: '3', label: 'До 3 месяцев', hint: '(короткий срок)' },
  { value: '6', label: 'Полгода', hint: '(6 месяцев)' },
  { value: '12', label: 'Год и дольше', hint: '(от 12 месяцев)' },
];

export function BudgetStep({
  state,
  step,
  totalSteps,
  onSubmit,
  onBack,
}: BudgetStepProps) {
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
      ? 'Минимум не может быть больше максимума'
      : null;

  return (
    <OnboardingLayout
      step={step}
      totalSteps={totalSteps}
      title="Какой у тебя бюджет?"
      subtitle="Аренда в месяц, ₽"
      onBack={onBack}
      onNext={() =>
        onSubmit({
          budgetMin: minVal,
          budgetMax: maxVal,
          moveInDate: moveInDate || undefined,
          stayDurationMonths: stayDuration ? Number(stayDuration) : undefined,
        })
      }
      canGoNext={!budgetError}
      loading={state.loading}
    >
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-3">
          <BudgetInput
            value={budgetMin}
            onChange={setBudgetMin}
            placeholder="от 20 000"
            label="Бюджет от"
          />
          <BudgetInput
            value={budgetMax}
            onChange={setBudgetMax}
            placeholder="до 50 000"
            label="Бюджет до"
          />
        </div>
        {budgetError && (
          <p role="alert" className="text-sm font-bold text-rose-500">
            {budgetError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-(--text-deep) opacity-65">
          Дата въезда
        </span>
        <DateField value={moveInDate} onChange={setMoveInDate} label="Дата въезда" />
      </div>

      <div role="radiogroup" aria-label="Срок проживания" className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-(--text-deep) opacity-65">
          Срок проживания
        </span>
        {DURATION_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.value || 'unknown'}
            selected={stayDuration === opt.value}
            onSelect={() => setStayDuration(opt.value)}
            label={opt.label}
            hint={opt.hint}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}

// Шаг подкрутки. 1000 ₽ — цена одного нажатия: с шагом в сотню до 40 000 пришлось
// бы тыкать вечно, с шагом в 5000 не попасть в «23 000».
const BUDGET_STEP = 1000;
// Верхняя граница, чтобы удержанная кнопка не увела поле в миллиарды.
const BUDGET_MAX = 1_000_000;

// Поле суммы. Раньше это был <input type="number">, и он тянул за собой обе
// проблемы со скриншота: нативные спиннеры чужого стиля и возможность ввести
// «-1» (минус, e, плюс — всё это валидный ввод для type=number).
// Здесь хранится и отдаётся ТОЛЬКО строка цифр, а показывается она с
// разделителями разрядов — как в плейсхолдере «от 20 000».
function BudgetInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  label: string;
}) {
  const amount = value ? Number(value) : null;

  const shift = (delta: number) => {
    const next = Math.min(BUDGET_MAX, Math.max(0, (amount ?? 0) + delta));
    haptic('light');
    onChange(String(next));
  };

  return (
    <div className="relative">
      <TextInput
        type="text"
        inputMode="numeric"
        // Ввод отфильтрован до цифр, поэтому знака минуса тут появиться неоткуда.
        value={amount === null ? '' : amount.toLocaleString('ru-RU')}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 7))}
        placeholder={placeholder}
        aria-label={label}
        className="h-14 w-full pl-4 pr-10 text-center text-base font-bold"
      />

      {/* Свои стрелки вместо системных: те рисуются движком и не поддаются
          стилизации — на стеклянном фоне они выглядели инородной серой кнопкой. */}
      <div className="absolute inset-y-1.5 right-1.5 flex w-8 flex-col gap-1">
        <StepButton
          label={`${label}: прибавить ${BUDGET_STEP}`}
          onClick={() => shift(BUDGET_STEP)}
          disabled={amount !== null && amount >= BUDGET_MAX}
          dir="up"
        />
        <StepButton
          label={`${label}: убавить ${BUDGET_STEP}`}
          onClick={() => shift(-BUDGET_STEP)}
          // Ниже нуля не опускаемся: отрицательной аренды не бывает.
          disabled={!amount}
          dir="down"
        />
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  dir,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  dir: 'up' | 'down';
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 items-center justify-center rounded-lg bg-white/40 text-(--text-deep) transition-all duration-150 active:scale-90 active:bg-white/60 disabled:opacity-30"
    >
      <svg
        width="11"
        height="7"
        viewBox="0 0 11 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={dir === 'down' ? { transform: 'scaleY(-1)' } : undefined}
      >
        <path d="M1.5 5.5 5.5 1.5 9.5 5.5" />
      </svg>
    </button>
  );
}
