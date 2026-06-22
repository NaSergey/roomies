'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeed, postSwipe } from '@/shared/lib/api';

export const feedKeys = {
  all: ['feed'] as const,
};

export function useFeedQuery() {
  return useQuery({
    queryKey: feedKeys.all,
    queryFn: getFeed,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSwipeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetId, action }: { targetId: number; action: 'like' | 'pass' }) =>
      postSwipe(targetId, action),
    onSuccess: (_data, { action }) => {
      // После лайка инвалидируем фид, чтобы при следующем
      // обращении (пустая колода) данные были свежими.
      if (action === 'like') {
        queryClient.invalidateQueries({ queryKey: feedKeys.all });
      }
    },
  });
}
