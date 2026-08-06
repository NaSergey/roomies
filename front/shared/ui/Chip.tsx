'use client';

import type { ReactNode } from 'react';

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Доп. классы (напр. паддинг). По умолчанию px-3 py-1. */
  className?: string;
}

// Переключаемый «чип» (фильтры, правила в анкете). Раньше дублировался как
// локальные Chip (FilterSheet) и ToggleChip (ProfileEditSheet) — один в один.
const BASE = 'rounded-full border-glass text-sm font-bold transition-all active:scale-95';
// Активный и неактивный — одно стекло, разница в тинте и в контрасте текста:
// плотной заливкой активный чип вываливался бы из стеклянного языка.
const ACTIVE = 'bg-accent-glass backdrop-glass text-(--text-on-accent) shadow-glass';
const INACTIVE = 'bg-glass backdrop-glass text-muted';

export function Chip({ active, onClick, children, className = 'px-3 py-1' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${BASE} ${className} ${active ? ACTIVE : INACTIVE}`}
    >
      {children}
    </button>
  );
}
