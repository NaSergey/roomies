'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, patchProfile } from '@/shared/lib/api';

export const profileKeys = {
  me: ['profile', 'me'] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: getMe,
    staleTime: Infinity,
  });
}

export function usePatchProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}
