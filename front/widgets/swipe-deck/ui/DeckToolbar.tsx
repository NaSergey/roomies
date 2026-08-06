'use client';

import { Glass } from '@samasante/liquid-glass';
import { haptic } from '@/shared/lib/telegram';
import type { DeckFilters } from './FilterSheet';
import { DEFAULT_FILTERS } from './FilterSheet';

const FILTER_LABELS: Partial<Record<string, string>> = {
  low: 'до 20 тыс.',
  mid: '20–35 тыс.',
  high: '35 тыс.+',
  'smokingOk:false': '🚭 Не курят',
  'smokingOk:true': '🚬 Курение ок',
  'petsOk:true': '🐾 Питомцы',
  'petsOk:false': '🚫 Без питомцев',
  'guestsPref:often': 'Гости часто',
  'guestsPref:sometimes': 'Гости иногда',
  'guestsPref:rarely': 'Гости редко',
};

interface DeckToolbarProps {
  filters: DeckFilters;
  onOpenFilters: () => void;
}

function isFilterActive(k: keyof DeckFilters, f: DeckFilters): boolean {
  if (k === 'districtIds') return f.districtIds.length > 0;
  return f[k] !== DEFAULT_FILTERS[k];
}

function activeCount(f: DeckFilters) {
  return (Object.keys(f) as (keyof DeckFilters)[]).filter((k) => isFilterActive(k, f)).length;
}

function ActiveChips({ filters }: { filters: DeckFilters }) {
  const chips: string[] = [];
  (Object.keys(filters) as (keyof DeckFilters)[]).forEach((k) => {
    if (!isFilterActive(k, filters)) return;
    if (k === 'districtIds') {
      chips.push(`${filters.districtIds.length} район${filters.districtIds.length === 1 ? '' : 'а'}`);
    } else if (k === 'smokingOk') {
      chips.push(FILTER_LABELS[`smokingOk:${filters.smokingOk}`] ?? '');
    } else if (k === 'petsOk') {
      chips.push(FILTER_LABELS[`petsOk:${filters.petsOk}`] ?? '');
    } else if (k === 'guestsPref') {
      chips.push(FILTER_LABELS[`guestsPref:${filters.guestsPref}`] ?? '');
    } else {
      const v = filters[k] as string;
      chips.push(FILTER_LABELS[v] ?? v);
    }
  });

  return (
    <>
      {chips.filter(Boolean).map((label) => (
        <Glass
          key={label}
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
          style={{
            background:
              'linear-gradient(120deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 12%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.28) 100%), rgba(255,255,255,0.14)',
          }}
          optics={{ frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 }}
        >
          {label}
        </Glass>
      ))}
    </>
  );
}

export function DeckToolbar({ filters, onOpenFilters }: DeckToolbarProps) {
  const count = activeCount(filters);

  return (
    <div className="flex shrink-0 items-center gap-2 pb-2">
      {/* Кнопка фильтров — стекло */}
      <button
        type="button"
        onClick={() => { haptic('light'); onOpenFilters(); }}
        className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-glass backdrop-glass border-glass px-3 py-1.5 text-sm font-black text-white shadow-glass transition-transform active:scale-95"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="10" y1="18" x2="14" y2="18" />
        </svg>
        Фильтры
        {count > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#14140f]">
            {count}
          </span>
        )}
      </button>

      {/* Активные чипы — горизонтальный скролл */}
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ActiveChips filters={filters} />
      </div>
    </div>
  );
}
