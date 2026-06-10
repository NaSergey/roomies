'use client';

import { useState } from 'react';
import { haptic } from '@/shared/lib/telegram';
import { QUIZ_QUESTIONS } from '../../model/quiz-questions';
import type { OnboardingState, QuizAnswer } from '../../model/types';

interface QuizStepProps {
  state: OnboardingState;
  onSubmit: (answers: QuizAnswer[]) => void;
}

export function QuizStep({ state, onSubmit }: QuizStepProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const question = QUIZ_QUESTIONS[currentIndex];

  function handleAnswer(opt: { code: string; label: string; value: number }) {
    if (advancing) return;

    haptic('light');
    setSelectedCode(opt.code);
    setAdvancing(true);

    const newAnswer: QuizAnswer = {
      questionId: question.id,
      optionCode: opt.code,
      answerValue: opt.value,
    };

    const allAnswers = [...answers, newAnswer];
    setAnswers(allAnswers);

    setTimeout(() => {
      if (currentIndex < 9) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedCode(null);
        setAdvancing(false);
      } else {
        onSubmit(allAnswers);
      }
    }, 300);
  }

  if (state.loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6">
        {/* Main step progress bar */}
        <div
          role="progressbar"
          aria-valuenow={4}
          aria-valuemax={6}
          aria-label="Прогресс онбординга"
          className="h-1 w-full rounded-full bg-surface-2 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${(4 / 6) * 100}%` }}
          />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span
            className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-muted"
            aria-label="Загрузка"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6">
      {/* Main step progress bar */}
      <div
        role="progressbar"
        aria-valuenow={4}
        aria-valuemax={6}
        aria-label="Прогресс онбординга"
        className="h-1 w-full rounded-full bg-surface-2 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${(4 / 6) * 100}%` }}
        />
      </div>

      {/* Quiz sub-progress */}
      <div>
        <p className="text-right text-xs text-muted mb-1">
          {currentIndex + 1} / 10
        </p>
        <div
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemax={10}
          aria-label="Прогресс викторины"
          className="h-1 w-full rounded-full bg-surface-2 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / 10) * 100}%` }}
          />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-(--text)">
        Расскажем, кто тебе подойдёт
      </h1>

      {/* Question card */}
      <div
        className="rounded-3xl bg-surface px-6 py-8 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <span className="text-5xl" aria-hidden="true">
          {question.categoryIcon}
        </span>
        <p className="mt-4 text-xl font-bold text-(--text)">{question.text}</p>
      </div>

      {/* Option buttons */}
      <div role="radiogroup" className="mt-2 flex flex-col gap-3">
        {[question.optionA, question.optionB].map((opt) => {
          const isSelected = selectedCode === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleAnswer(opt)}
              disabled={advancing}
              className={[
                'flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-4',
                'text-base font-medium transition-transform duration-150 active:scale-[0.97]',
                isSelected
                  ? 'bg-accent text-(--text-on-accent)'
                  : 'bg-surface text-(--text)',
              ].join(' ')}
              style={{ boxShadow: 'var(--shadow-button)' }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
