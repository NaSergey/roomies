'use client';

import { useState } from 'react';
import { haptic } from '@/shared/lib/telegram';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { QUIZ_QUESTIONS } from '../../model/quiz-questions';
import type { OnboardingState, QuizAnswer } from '../../model/types';

interface QuizStepProps {
  state: OnboardingState;
  onSubmit: (answers: QuizAnswer[]) => void;
}

function ProgressBar({
  value,
  max,
  label,
  animated = false,
}: {
  value: number;
  max: number;
  label: string;
  animated?: boolean;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full border-2 border-black bg-[#f0efe9]"
    >
      <div
        className={`h-full rounded-full bg-accent${animated ? ' transition-all duration-300' : ''}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
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
        <ProgressBar value={4} max={6} label="Прогресс онбординга" />
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
      <ProgressBar value={4} max={6} label="Прогресс онбординга" />

      {/* Quiz sub-progress */}
      <div>
        <p className="text-right text-xs text-muted mb-1">
          {currentIndex + 1} / 10
        </p>
        <ProgressBar
          value={currentIndex + 1}
          max={10}
          label="Прогресс викторины"
          animated
        />
      </div>

      <h1 className="text-2xl font-black text-(--text)">
        Расскажем, кто тебе подойдёт
      </h1>

      {/* Question card */}
      <Card className="px-6 py-8 text-center">
        <span className="text-5xl" aria-hidden="true">
          {question.categoryIcon}
        </span>
        <p className="mt-4 text-xl font-black text-(--text)">{question.text}</p>
      </Card>

      {/* Option buttons */}
      <div role="radiogroup" className="mt-2 flex flex-col gap-3">
        {[question.optionA, question.optionB].map((opt) => (
          <Button
            key={opt.code}
            flat
            variant={selectedCode === opt.code ? 'accent' : 'white'}
            role="radio"
            aria-checked={selectedCode === opt.code}
            onClick={() => handleAnswer(opt)}
            disabled={advancing}
            className="h-14 w-full text-base"
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
