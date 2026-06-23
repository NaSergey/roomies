'use client';

import type { HTMLAttributes, ReactNode } from 'react';

// Необруталистская карточка: рамка + жёсткая тень. Раньше эта связка классов
// дублировалась по блокам (EmptyState, RoomieScoreCard, карточка вопроса квиза…).
// Раскладку/паддинг/фон-отступы оставляем на месте вызова через className.
const BASE =
  'rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_rgba(20,20,15,0.9)]';

export function Card({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`${BASE} ${className}`} {...rest}>
      {children}
    </div>
  );
}
