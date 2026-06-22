'use client';

import { useEffect } from 'react';

export interface DeckFilters {
  age: '18-22' | '23-26' | '27-30' | 'all';
  schedule: 'early' | 'night' | 'any';
  cleanliness: 'neat' | 'normal' | 'relaxed' | 'any';
  budget: 'low' | 'mid' | 'high' | 'any';
}

export const DEFAULT_FILTERS: DeckFilters = {
  age: 'all',
  schedule: 'any',
  cleanliness: 'any',
  budget: 'any',
};

interface FilterSheetProps {
  open: boolean;
  filters: DeckFilters;
  onChange: (f: DeckFilters) => void;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-black uppercase tracking-widest text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 border-black px-3 py-1 text-sm font-bold transition-all duration-150 active:scale-95 ${
        active
          ? 'bg-accent text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)]'
          : 'bg-white text-[#6f6f68]'
      }`}
    >
      {children}
    </button>
  );
}

export function FilterSheet({ open, filters, onChange, onClose }: FilterSheetProps) {
  // Закрытие по Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const set = <K extends keyof DeckFilters>(key: K, val: DeckFilters[K]) =>
    onChange({ ...filters, [key]: val });

  return (
    <>
      {/* Backdrop — fixed, покрывает весь экран */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sheet — fixed снизу экрана */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 flex flex-col gap-5 rounded-t-3xl border-t-2 border-black bg-white px-5 pt-4 pb-8 shadow-[0_-4px_0_rgba(20,20,15,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="mx-auto h-1 w-10 rounded-full bg-[#d0d0cc]" />

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-(--text)">Фильтры</h3>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs font-bold text-muted underline underline-offset-2"
          >
            Сбросить
          </button>
        </div>

        <Row label="Возраст">
          {(['18-22', '23-26', '27-30', 'all'] as const).map((v) => (
            <Chip key={v} active={filters.age === v} onClick={() => set('age', v)}>
              {v === 'all' ? 'Любой' : v}
            </Chip>
          ))}
        </Row>

        <Row label="Режим">
          <Chip active={filters.schedule === 'early'} onClick={() => set('schedule', 'early')}>🌅 Жаворонок</Chip>
          <Chip active={filters.schedule === 'night'}  onClick={() => set('schedule', 'night')}>🌙 Сова</Chip>
          <Chip active={filters.schedule === 'any'}   onClick={() => set('schedule', 'any')}>Любой</Chip>
        </Row>

        <Row label="Чистота">
          <Chip active={filters.cleanliness === 'neat'}    onClick={() => set('cleanliness', 'neat')}>🧹 Педант</Chip>
          <Chip active={filters.cleanliness === 'normal'}  onClick={() => set('cleanliness', 'normal')}>✌️ Нормально</Chip>
          <Chip active={filters.cleanliness === 'relaxed'} onClick={() => set('cleanliness', 'relaxed')}>😌 Расслабленно</Chip>
          <Chip active={filters.cleanliness === 'any'}     onClick={() => set('cleanliness', 'any')}>Любая</Chip>
        </Row>

        <Row label="Бюджет / мес.">
          <Chip active={filters.budget === 'low'}  onClick={() => set('budget', 'low')}>до 20 тыс.</Chip>
          <Chip active={filters.budget === 'mid'}  onClick={() => set('budget', 'mid')}>20–35 тыс.</Chip>
          <Chip active={filters.budget === 'high'} onClick={() => set('budget', 'high')}>35 тыс.+</Chip>
          <Chip active={filters.budget === 'any'}  onClick={() => set('budget', 'any')}>Любой</Chip>
        </Row>

        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full rounded-full border-2 border-black bg-accent py-3 text-sm font-black text-[#14140f] shadow-[3px_3px_0_rgba(20,20,15,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_rgba(20,20,15,0.9)] transition-all duration-100"
        >
          Показать результаты
        </button>
      </div>
    </>
  );
}
