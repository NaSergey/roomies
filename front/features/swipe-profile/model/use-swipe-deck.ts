'use client';

import { useCallback, useState } from 'react';
import { haptic, hapticNotify } from '@/shared/lib/telegram';
import type { RoomieProfile } from '@/entities/profile';
import type { SwipeDirection } from './types';

const EXIT_ANIMATION_MS = 220;
const VISIBLE_STACK = 3;

interface UseSwipeDeckResult {
  visible: RoomieProfile[];
  exitDirection: SwipeDirection | null;
  isEmpty: boolean;
  swipe: (direction: SwipeDirection) => void;
  reset: () => void;
}

// Управление состоянием колоды: какие 3 карты видны, какая улетает.
// Хук в feature — фича владеет правилом «как обрабатывать свайп».
export function useSwipeDeck(profiles: RoomieProfile[]): UseSwipeDeckResult {
  const [index, setIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);

  const swipe = useCallback((direction: SwipeDirection) => {
    if (direction === 'right') hapticNotify('success');
    else haptic('light');

    setExitDirection(direction);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setExitDirection(null);
    }, EXIT_ANIMATION_MS);
  }, []);

  const reset = useCallback(() => {
    setIndex(0);
    setExitDirection(null);
  }, []);

  const visible = profiles.slice(index, index + VISIBLE_STACK);
  const isEmpty = visible.length === 0;

  return { visible, exitDirection, isEmpty, swipe, reset };
}

export const SWIPE_EXIT_DURATION_MS = EXIT_ANIMATION_MS;
