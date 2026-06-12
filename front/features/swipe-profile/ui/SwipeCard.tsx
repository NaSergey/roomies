'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { ProfileCard, type RoomieProfile } from '@/entities/profile';
import {
  SWIPE_EXIT_DURATION_MS,
} from '../model/use-swipe-deck';
import type { SwipeDirection, SwipeHandler } from '../model/types';

interface SwipeCardProps {
  profile: RoomieProfile;
  isTop: boolean;
  stackIndex: number; // 0 — верх стопки, 1 — следующая, и т.д.
  exitDirection: SwipeDirection | null;
  onSwipe: SwipeHandler;
}

const SWIPE_THRESHOLD = 120; // px
const VELOCITY_THRESHOLD = 500; // px/s
// Пружинистый возврат и плавный «приход» соседних карт в верх стопки.
const SPRING_TRANSITION = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
// Быстрый вылет за экран без овершута.
const EXIT_TRANSITION = `transform ${SWIPE_EXIT_DURATION_MS}ms ease-out, opacity ${SWIPE_EXIT_DURATION_MS}ms ease-out`;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function SwipeCard({
  profile,
  isTop,
  stackIndex,
  exitDirection,
  onSwipe,
}: SwipeCardProps) {
  const [x, setX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ pointerId: -1, startX: 0, startTime: 0 });

  const isExiting = isTop && exitDirection !== null;
  const dragEnabled = isTop && !isExiting;

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!dragEnabled) return;
    dragStart.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startTime: Date.now(),
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!isDragging || e.pointerId !== dragStart.current.pointerId) return;
    setX(e.clientX - dragStart.current.startX);
  }

  function handlePointerEnd(e: PointerEvent<HTMLDivElement>) {
    if (!isDragging || e.pointerId !== dragStart.current.pointerId) return;
    setIsDragging(false);

    const dt = Math.max(1, Date.now() - dragStart.current.startTime);
    const velocity = (x / dt) * 1000; // px/s

    let direction: SwipeDirection | null = null;
    if (x > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) direction = 'right';
    else if (x < -SWIPE_THRESHOLD || velocity < -VELOCITY_THRESHOLD)
      direction = 'left';

    if (direction) {
      // Парент через onSwipe выставит exitDirection → анимация вылета.
      // x не сбрасываем — иначе будет «дёрг» к нулю перед exit-анимацией.
      onSwipe(direction);
    } else {
      // Не дотянули порог — пружиним обратно.
      setX(0);
    }
  }

  // Композиция трансформов: глубина стопки + активная позиция верхней карты.
  const stackTransform = `translateY(${stackIndex * 12}px) scale(${1 - stackIndex * 0.04})`;

  let activeTransform: string;
  let opacity = 1;
  let transition: string;

  if (isExiting) {
    const dx = exitDirection === 'right' ? 600 : -600;
    const dr = exitDirection === 'right' ? 30 : -30;
    activeTransform = `translateX(${dx}px) rotate(${dr}deg) ${stackTransform}`;
    opacity = 0;
    transition = EXIT_TRANSITION;
  } else if (isTop) {
    const rotate = clamp(x * 0.06, -18, 18);
    activeTransform = `translateX(${x}px) rotate(${rotate}deg) ${stackTransform}`;
    transition = isDragging ? 'none' : SPRING_TRANSITION;
  } else {
    activeTransform = stackTransform;
    transition = SPRING_TRANSITION;
  }

  // Оверлеи LIKE/NOPE появляются по мере драга и исчезают на exit/spring-back.
  const likeOpacity = isTop && !isExiting ? clamp((x - 40) / 100, 0, 1) : 0;
  const nopeOpacity = isTop && !isExiting ? clamp((-x - 40) / 100, 0, 1) : 0;

  const overlay = isTop ? (
    <>
      <div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-6 rounded-xl border-4 border-emerald-400 px-4 py-2 text-2xl font-black uppercase tracking-wider text-emerald-400 -rotate-12 pointer-events-none transition-opacity duration-150"
      >
        Like
      </div>
      <div
        style={{ opacity: nopeOpacity }}
        className="absolute top-8 right-6 rounded-xl border-4 border-rose-500 px-4 py-2 text-2xl font-black uppercase tracking-wider text-rose-500 rotate-12 pointer-events-none transition-opacity duration-150"
      >
        Nope
      </div>
    </>
  ) : null;

  return (
    <div
      className="absolute inset-0 touch-none select-none"
      style={{
        transform: activeTransform,
        opacity,
        transition,
        zIndex: 10 - stackIndex,
        cursor: dragEnabled ? (isDragging ? 'grabbing' : 'grab') : 'default',
        willChange: dragEnabled ? 'transform' : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <ProfileCard profile={profile} priority={isTop} overlay={overlay} />
    </div>
  );
}
