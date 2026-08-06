'use client';

import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Доп. классы для панели (по умолчанию gap-4). Напр. "gap-5". */
  className?: string;
  label?: string;
}

// Единая нижняя шторка: затемнение + выезжающая снизу стеклянная панель + «ручка».
// Раньше каждая форма-шторка повторяла эту разметку со своими расхождениями
// (z-index, фон, наличие анимации). Канон — выезжающая стеклянная панель
// (bg-glass/backdrop-glass/border-glass/shadow-glass, globals.css).
const OVERLAY =
  'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300';
const PANEL =
  'fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-y-auto rounded-t-3xl ' +
  'bg-glass backdrop-glass border-glass shadow-glass px-5 pt-4 pb-8 ' +
  'transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] max-h-[88dvh]';

export function BottomSheet({
  open,
  onClose,
  children,
  className = 'gap-4',
  label,
}: BottomSheetProps) {
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`${OVERLAY} ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`${PANEL} ${className} ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-white/50" />
        {children}
      </div>
    </>
  );
}
