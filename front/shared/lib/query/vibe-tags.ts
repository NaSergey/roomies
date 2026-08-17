'use client';

import { useQuery } from '@tanstack/react-query';
import { getVibeTags, type VibeTag } from '@/shared/lib/api';

export const vibeTagKeys = {
  all: ['vibe-tags'] as const,
};

/** Справочник вайб-тегов.
 *
 *  staleTime: Infinity по той же причине, что у городов и районов: набор тегов
 *  за сессию не меняется, а шаг «Расскажи о себе» размонтируется при каждом
 *  уходе назад и раньше запрашивал их заново своим fetch. */
export function useVibeTagsQuery() {
  return useQuery({
    queryKey: vibeTagKeys.all,
    queryFn: getVibeTags,
    staleTime: Infinity,
  });
}

export type { VibeTag };
