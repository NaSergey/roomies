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
const BASE = 'rounded-full border-2 border-black text-sm font-bold transition-all active:scale-95';
const ACTIVE = 'bg-accent text-(--text-on-accent) shadow-[2px_2px_0_rgba(20,20,15,0.9)]';
const INACTIVE = 'bg-white text-muted';

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
