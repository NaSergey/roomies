'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/features/profile';
import {
  OnboardingLayout,
  QUIZ_QUESTIONS,
  RadioRow,
  saveQuiz,
  type QuizAnswer,
} from '@/features/onboarding';
import { ApiError } from '@/shared/lib/api';

interface VibeQuizScreenProps {
  open: boolean;
  onClose: () => void;
}

const TOTAL = QUIZ_QUESTIONS.length;

// Вайб-квиз на весь экран поверх профиля. Тот же каркас, что у шагов
// онбординга (OnboardingLayout) — опросные экраны должны выглядеть одинаково.
export function VibeQuizScreen({ open, onClose }: VibeQuizScreenProps) {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  // По questionId, а не по индексу: при возврате назад ответ остаётся выбранным.
  const [answers, setAnswers] = useState<Record<number, QuizAnswer>>({});

  const mutation = useMutation({
    mutationFn: saveQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
      onClose();
    },
  });

  useEffect(() => {
    if (open) {
      setIndex(0);
      setAnswers({});
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const question = QUIZ_QUESTIONS[index];
  const selected = answers[question.id];
  const isLast = index === TOTAL - 1;

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? 'Не удалось сохранить ответы'
        : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Вайб-квиз"
      className="fixed inset-0 z-50"
      // Фон не свой — тот же var(--bg), что и во всём приложении; экран лишь
      // перекрывает профиль под собой.
      style={{ background: 'var(--bg)' }}
    >
      <div className="mx-auto h-full w-full max-w-md">
        <OnboardingLayout
          step={index + 1}
          totalSteps={TOTAL}
          title={question.text}
          // На первом вопросе «назад» выходит из квиза — иначе с экрана не выбраться.
          onBack={() => (index === 0 ? onClose() : setIndex((i) => i - 1))}
          onNext={() => {
            if (isLast) mutation.mutate({ answers: Object.values(answers) });
            else setIndex((i) => i + 1);
          }}
          canGoNext={Boolean(selected)}
          loading={mutation.isPending}
        >
          <div role="radiogroup" className="flex flex-col gap-2">
            {[question.optionA, question.optionB].map((opt) => (
              <RadioRow
                key={opt.code}
                selected={selected?.optionCode === opt.code}
                onSelect={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: {
                      questionId: question.id,
                      optionCode: opt.code,
                      answerValue: opt.value,
                    },
                  }))
                }
                label={opt.label}
              />
            ))}
          </div>

          {errorMessage && (
            <p className="text-center text-sm font-bold text-rose-500" role="alert">
              {errorMessage}
            </p>
          )}
        </OnboardingLayout>
      </div>
    </div>
  );
}
