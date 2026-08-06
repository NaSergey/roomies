'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { advanceGradientPhase } from '@/shared/lib/gradient';
import { haptic, hapticNotify } from '@/shared/lib/telegram';
import type { RoomieProfile } from '@/entities/profile';
import type { SwipeDirection } from './types';

const TRANSITION_MS = 260;    // длительность вылета/въезда
const ADVANCE_DELAY_MS = 280; // когда продвигаем колоду (с буфером после анимации)
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
//
// Прогресс храним по ID свайпнутых карт (consumed), а НЕ по позиционному индексу.
// Иначе при рефетче ленты (invalidate после like убирает свайпнутого с сервера)
// массив profiles сдвигается, а позиционный индекс уже уехал вперёд — и видимая
// верхняя карта прыгает на следующую (B мелькает и превращается в C, B пропускается).
// Фильтр по ID к такому сдвигу устойчив: первая несвайпнутая карта остаётся той же.
export function useSwipeDeck(profiles: RoomieProfile[]): UseSwipeDeckResult {
  const [consumed, setConsumed] = useState<Set<number>>(() => new Set());
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);
  const [enterDirection, setEnterDirection] = useState<SwipeDirection | null>(null);
  const lockRef = useRef(false);

  const remaining = useMemo(
    () => profiles.filter((p) => !consumed.has(p.id)),
    [profiles, consumed],
  );
  // Текущая верхняя карта на момент свайпа — берём из ref, чтобы setTimeout
  // пометил consumed именно её, даже если лента успела перерисоваться.
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  const swipe = useCallback((direction: SwipeDirection): boolean => {
    if (lockRef.current) return false; // защита от двойного свайпа во время анимации
    const topId = remainingRef.current[0]?.id;
    if (topId == null) return false;
    lockRef.current = true;

    if (direction === 'right') hapticNotify('success');
    else haptic('light');

    advanceGradientPhase(); // фон «дышит» — как у Telegram при отправке сообщения

    setExitDirection(direction);   // верхняя — вылетает
    setEnterDirection(direction);  // следующая — въезжает (одновременно)

    setTimeout(() => {
      setConsumed((prev) => {
        if (prev.has(topId)) return prev;
        const next = new Set(prev);
        next.add(topId);
        return next;
      });
      setExitDirection(null);
      setEnterDirection(null);
      lockRef.current = false;
    }, ADVANCE_DELAY_MS);

    return true;
  }, []);

  const reset = useCallback(() => {
    lockRef.current = false;
    setConsumed(new Set());
    setExitDirection(null);
    setEnterDirection(null);
  }, []);

  const visible = remaining.slice(0, VISIBLE_STACK);
  const isEmpty = visible.length === 0;

  return { visible, exitDirection, enterDirection, isEmpty, swipe, reset };
}

export const SWIPE_EXIT_DURATION_MS = TRANSITION_MS;
