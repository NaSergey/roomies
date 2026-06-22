'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeed, postSwipe, type FeedQueryParams } from '@/shared/lib/api';

export const feedKeys = {
  all: ['feed'] as const,
  filtered: (params: FeedQueryParams) => ['feed', params] as const,
};

export function useFeedQuery(params?: FeedQueryParams) {
  const hasParams = params && Object.keys(params).length > 0;
  return useQuery({
    queryKey: hasParams ? feedKeys.filtered(params) : feedKeys.all,
    queryFn: () => getFeed(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSwipeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      targetId,
      action,
    }: {
      targetId: number;
      action: 'like' | 'pass' | 'super_like' | 'save';
    }) => postSwipe(targetId, action),
    onSuccess: (_data, { action }) => {
      if (action === 'like' || action === 'super_like') {
        queryClient.invalidateQueries({ queryKey: feedKeys.all, exact: false });
      }
    },
  });
}

export type { FeedQueryParams };
