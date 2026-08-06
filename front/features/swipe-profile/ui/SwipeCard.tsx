'use client';

import { useLayoutEffect, useMemo, useRef, type PointerEvent } from 'react';
import { ProfileCard, type RoomieProfile } from '@/entities/profile';
import { SWIPE_EXIT_DURATION_MS } from '../model/use-swipe-deck';
import type { SwipeDirection, SwipeHandler } from '../model/types';

interface SwipeCardProps {
  profile: RoomieProfile;
  isTop: boolean;
  stackIndex: number; // 0 — верхняя (видна), 1+ — в очереди (скрыта до своего въезда)
  exitDirection: SwipeDirection | null;  // на верхней карте — вылет
  enterDirection: SwipeDirection | null; // на следующей карте — въезд с противоположной стороны
  onSwipe: SwipeHandler;
  onCardTap?: () => void;
}

const SWIPE_THRESHOLD = 110; // px
const VELOCITY_THRESHOLD = 500; // px/s
const EXIT_DISTANCE = 600; // px — куда улетает свайпнутая карта / откуда въезжает следующая

const SPRING = 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)';
const EXIT_TRANSITION = `transform ${SWIPE_EXIT_DURATION_MS}ms ease-out, opacity ${SWIPE_EXIT_DURATION_MS}ms ease-out`;
// Обычный ease-out (не агрессивная кривая старой scale-анимации): на полноценном
// слайде в 600px она делала почти весь путь за первые ~30мс — не «влёт», а телепорт.
const ENTER_TRANSITION = `transform ${SWIPE_EXIT_DURATION_MS}ms ease-out`;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function SwipeCard({
  profile,
  isTop,
  stackIndex,
  exitDirection,
  enterDirection,
  onSwipe,
  onCardTap,
}: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const likeRef = useRef<HTMLDivElement>(null);
  const nopeRef = useRef<HTMLDivElement>(null);

  const xRef = useRef(0);
  const yRef = useRef(0);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef(-1);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);

  const isExiting = isTop && exitDirection !== null;
  const isEntering = stackIndex === 1 && enterDirection !== null;
  const dragEnabled = isTop && !isExiting;

  // Применяем трансформ ПРЯМО в DOM (без React-ререндера на кадр). React style ниже
  // намеренно не содержит transform/opacity, чтобы ререндеры не сбрасывали анимацию.
  const paintDrag = () => {
    const x = xRef.current;
    const rot = clamp(x * 0.055, -16, 16);
    const el = cardRef.current;
    if (el) el.style.transform = `translate3d(${x}px,0,0) rotate(${rot}deg)`;
    if (likeRef.current) likeRef.current.style.opacity = `${clamp((x - 40) / 90, 0, 1)}`;
    if (nopeRef.current) nopeRef.current.style.opacity = `${clamp((-x - 40) / 90, 0, 1)}`;
  };

  // ── ВЪЕЗД: следующая карта появляется с ПРОТИВОПОЛОЖНОЙ стороны от свайпа
  // (свайпнули влево → следующая влетает справа, и наоборот) — карты больше не
  // лежат «стопкой» друг за другом, вне анимации следующая карта не видна.
  useLayoutEffect(() => {
    if (!isEntering) return;
    const el = cardRef.current;
    if (!el) return;
    const startX = enterDirection === 'left' ? EXIT_DISTANCE : -EXIT_DISTANCE;
    el.style.transition = 'none';
    el.style.transform = `translate3d(${startX}px,0,0)`;
    el.style.opacity = '1';
    // Форсируем reflow, чтобы браузер зафиксировал стартовую позицию ДО того,
    // как включится transition — иначе оба присваивания схлопнутся в один кадр
    // и слайда не будет видно.
    void el.offsetWidth;
    el.style.transition = ENTER_TRANSITION;
    el.style.transform = 'translate3d(0,0,0)';
  }, [isEntering, enterDirection]);

  // ── ВЫЛЕТ: верхняя карта улетает из текущего (возможно, перетащенного) положения.
  useLayoutEffect(() => {
    if (!isExiting) return;
    const el = cardRef.current;
    if (!el) return;
    const dx = exitDirection === 'right' ? EXIT_DISTANCE : -EXIT_DISTANCE;
    const dr = exitDirection === 'right' ? 28 : -28;
    el.style.transition = EXIT_TRANSITION;
    el.style.transform = `translate3d(${dx}px,0,0) rotate(${dr}deg)`;
    el.style.opacity = '0';
  }, [isExiting, exitDirection]);

  // ── ПОКОЙ: верхняя — по центру, видна; все остальные — скрыты (предзагружены,
  // чтобы не было рывка при собственном въезде, но не «просвечивают» позади верхней).
  useLayoutEffect(() => {
    if (isExiting || isEntering) return;
    const el = cardRef.current;
    if (!el) return;
    xRef.current = 0;
    el.style.transition = 'none';
    el.style.transform = 'translate3d(0,0,0)';
    el.style.opacity = isTop ? '1' : '0';
    if (likeRef.current) likeRef.current.style.opacity = '0';
    if (nopeRef.current) nopeRef.current.style.opacity = '0';
  }, [isTop, stackIndex, isExiting, isEntering]);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!dragEnabled) return;
    draggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startTimeRef.current = performance.now();
    const el = cardRef.current;
    if (el) el.style.transition = 'none';
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || e.pointerId !== pointerIdRef.current) return;
    xRef.current = e.clientX - startXRef.current;
    yRef.current = e.clientY - startYRef.current;
    paintDrag();
  }

  function handlePointerEnd(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || e.pointerId !== pointerIdRef.current) return;
    draggingRef.current = false;

    const x = xRef.current;
    const y = yRef.current;
    const dt = Math.max(1, performance.now() - startTimeRef.current);
    const velocity = (x / dt) * 1000; // px/s

    if (Math.abs(x) < 10 && Math.abs(y) < 10) {
      onCardTap?.();
      return;
    }

    let direction: SwipeDirection | null = null;
    if (x > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) direction = 'right';
    else if (x < -SWIPE_THRESHOLD || velocity < -VELOCITY_THRESHOLD) direction = 'left';

    if (direction) {
      // Верхняя → exit, следующая → enter (въезжает сбоку) через ре-рендер по props.
      onSwipe(direction);
    } else {
      // Недотянули — пружиним верхнюю карту обратно в центр.
      const el = cardRef.current;
      xRef.current = 0;
      if (el) {
        el.style.transition = SPRING;
        el.style.transform = 'translate3d(0,0,0) rotate(0deg)';
      }
      if (likeRef.current) likeRef.current.style.opacity = '0';
      if (nopeRef.current) nopeRef.current.style.opacity = '0';
    }
  }

  const overlay = useMemo(
    () => (
      <>
        <div
          ref={likeRef}
          style={{ opacity: 0 }}
          className="absolute top-8 left-6 rounded-xl border-4 border-emerald-400 px-4 py-2 text-2xl font-black uppercase tracking-wider text-emerald-400 -rotate-12 pointer-events-none"
        >
          Like
        </div>
        <div
          ref={nopeRef}
          style={{ opacity: 0 }}
          className="absolute top-8 right-6 rounded-xl border-4 border-rose-500 px-4 py-2 text-2xl font-black uppercase tracking-wider text-rose-500 rotate-12 pointer-events-none"
        >
          Nope
        </div>
      </>
    ),
    [],
  );

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 touch-none select-none [backface-visibility:hidden]"
      style={{
        zIndex: 10 - stackIndex,
        cursor: dragEnabled ? 'grab' : 'default',
        // Обе видимые карты держим на GPU-слое: тяжёлый SVG-фильтр растеризуется
        // один раз, scale/translate идут через композитор (нет ре-растеризации).
        willChange: stackIndex <= 1 ? 'transform' : 'auto',
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
