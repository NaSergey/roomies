'use client';

import { useCallback, useRef, useState } from 'react';
import { haptic, hapticNotify } from '@/shared/lib/telegram';
import type { RoomieProfile } from '@/entities/profile';
import type { SwipeDirection } from './types';

const TRANSITION_MS = 260;    // длительность вылета/въезда
const ADVANCE_DELAY_MS = 280; // когда продвигаем индекс (с буфером после анимации)
const VISIBLE_STACK = 3;      // верхняя + следующая (видна за ней) + запас (предзагружен)

interface UseSwipeDeckResult {
  visible: RoomieProfile[];
  exitDirection: SwipeDirection | null;
  enterDirection: SwipeDirection | null;
  isEmpty: boolean;
  swipe: (direction: SwipeDirection) => boolean; // false — свайп проигнорирован (идёт анимация)
  reset: () => void;
}

// Управление состоянием колоды. Ключевое: при свайпе верхняя карта вылетает, а
// следующая ОДНОВРЕМЕННО въезжает с противоположной стороны (без пустого экрана).
// Индекс продвигаем только после завершения анимации.
export function useSwipeDeck(profiles: RoomieProfile[]): UseSwipeDeckResult {
  const [index, setIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);
  const [enterDirection, setEnterDirection] = useState<SwipeDirection | null>(null);
  const lockRef = useRef(false);

  const swipe = useCallback((direction: SwipeDirection): boolean => {
    if (lockRef.current) return false; // защита от двойного свайпа во время анимации
    lockRef.current = true;

    if (direction === 'right') hapticNotify('success');
    else haptic('light');

    setExitDirection(direction);   // верхняя — вылетает
    setEnterDirection(direction);  // следующая — въезжает (одновременно)

    setTimeout(() => {
      setIndex((i) => i + 1);
      setExitDirection(null);
      setEnterDirection(null);
      lockRef.current = false;
    }, ADVANCE_DELAY_MS);

    return true;
  }, []);

  const reset = useCallback(() => {
    lockRef.current = false;
    setIndex(0);
    setExitDirection(null);
    setEnterDirection(null);
  }, []);

  const visible = profiles.slice(index, index + VISIBLE_STACK);
  const isEmpty = visible.length === 0;

  return { visible, exitDirection, enterDirection, isEmpty, swipe, reset };
}

export const SWIPE_EXIT_DURATION_MS = TRANSITION_MS;
