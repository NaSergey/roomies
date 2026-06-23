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

// Единая нижняя шторка: затемнение + выезжающая снизу панель + «ручка».
// Раньше каждая форма-шторка повторяла эту разметку со своими расхождениями
// (z-index, фон, наличие анимации). Канон — выезжающая белая панель.
const OVERLAY =
  'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300';
const PANEL =
  'fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-y-auto rounded-t-3xl border-t-2 border-black ' +
  'bg-white px-5 pt-4 pb-8 shadow-[0_-4px_0_rgba(20,20,15,0.9)] ' +
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
        <div className="mx-auto h-1 w-10 rounded-full bg-[#d0d0cc]" />
        {children}
      </div>
    </>
  );
}
