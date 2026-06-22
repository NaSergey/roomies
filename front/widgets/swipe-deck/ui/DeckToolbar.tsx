'use client';

import { haptic } from '@/shared/lib/telegram';
import type { DeckFilters } from './FilterSheet';
import { DEFAULT_FILTERS } from './FilterSheet';

const FILTER_LABELS: Partial<Record<string, string>> = {
  '18-22': '18–22',
  '23-26': '23–26',
  '27-30': '27–30',
  early: '🌅 Жаворонок',
  night: '🌙 Сова',
  neat: '🧹 Педант',
  normal: '✌️ Нормально',
  relaxed: '😌 Расслабленно',
  low: 'до 20 тыс.',
  mid: '20–35 тыс.',
  high: '35 тыс.+',
};

interface DeckToolbarProps {
  filters: DeckFilters;
  boosted: boolean;
  onOpenFilters: () => void;
  onBoost: () => void;
}

// Считаем количество активных (не-default) фильтров для бейджа.
function activeCount(f: DeckFilters) {
  return (Object.keys(f) as (keyof DeckFilters)[]).filter(
    (k) => f[k] !== DEFAULT_FILTERS[k],
  ).length;
}

// Активные фильтры в виде горизонтально прокручиваемых чипов.
function ActiveChips({ filters }: { filters: DeckFilters }) {
  const chips = (Object.entries(filters) as [keyof DeckFilters, string][])
    .filter(([k, v]) => v !== DEFAULT_FILTERS[k])
    .map(([, v]) => FILTER_LABELS[v] ?? v);

  return (
    <>
      {chips.map((label) => (
        <span
          key={label}
          className="shrink-0 rounded-full border-2 border-black bg-white px-2.5 py-0.5 text-xs font-bold text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)]"
        >
          {label}
        </span>
      ))}
    </>
  );
}

export function DeckToolbar({ filters, boosted, onOpenFilters, onBoost }: DeckToolbarProps) {
  const count = activeCount(filters);

  return (
    <div className="flex shrink-0 items-center gap-2 pb-2">
      {/* Кнопка фильтров — стикерный стиль */}
      <button
        type="button"
        onClick={() => { haptic('light'); onOpenFilters(); }}
        className="relative flex shrink-0 items-center gap-1.5 rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-black text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] transition-all duration-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="10" y1="18" x2="14" y2="18" />
        </svg>
        Фильтры
        {count > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-black text-[#14140f]">
            {count}
          </span>
        )}
      </button>

      {/* Активные чипы — горизонтальный скролл */}
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ActiveChips filters={filters} />
      </div>

      {/* Буст — жёлтая кнопка-стикер */}
      <button
        type="button"
        onClick={() => { haptic('medium'); onBoost(); }}
        className={`flex shrink-0 items-center gap-1 rounded-full border-2 border-black px-3 py-1.5 text-sm font-black transition-all duration-150 active:translate-x-px active:translate-y-px ${
          boosted
            ? 'bg-[#fff3a0] text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:shadow-[1px_1px_0_rgba(20,20,15,0.9)]'
            : 'bg-white text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:shadow-[1px_1px_0_rgba(20,20,15,0.9)]'
        }`}
      >
        <span style={{
          display: 'inline-block',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          transform: boosted ? 'scale(1.3) rotate(-10deg)' : 'scale(1)',
        }}>⚡</span>
        Буст
      </button>
    </div>
  );
}
