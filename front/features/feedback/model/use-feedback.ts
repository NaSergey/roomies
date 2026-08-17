'use client';

import { useMutation } from '@tanstack/react-query';
import { sendFeedback } from '@/shared/lib/api';

export const feedbackKeys = {
  mine: ['feedback', 'me'] as const,
};

export function useSendFeedback() {
  // Кэш инвалидировать нечего: список своих отзывов нигде не показывается —
  // отправил и забыл. Появится экран «мои обращения» — сюда придёт invalidate.
  return useMutation({ mutationFn: sendFeedback });
}
