'use client';

import { useEffect, useRef, useState } from 'react';
import { getDistricts, type District } from '@/shared/lib/api';

export interface DeckFilters {
  age: '18-22' | '23-26' | '27-30' | 'all';
  schedule: 'early' | 'night' | 'any';
  cleanliness: 'neat' | 'normal' | 'relaxed' | 'any';
  budget: 'low' | 'mid' | 'high' | 'any';
  districtIds: number[];
  smokingOk: boolean | null;
  petsOk: boolean | null;
  guestsPref: 'often' | 'sometimes' | 'rarely' | null;
}

export const DEFAULT_FILTERS: DeckFilters = {
  age: 'all',
  schedule: 'any',
  cleanliness: 'any',
  budget: 'any',
  districtIds: [],
  smokingOk: null,
  petsOk: null,
  guestsPref: null,
};

interface FilterSheetProps {
  open: boolean;
  filters: DeckFilters;
  onChange: (f: DeckFilters) => void;
  onApply: (filters: DeckFilters) => void;
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

export function FilterSheet({ open, filters, onChange, onApply, onClose }: FilterSheetProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const districtsRef = useRef<District[]>([]);

  useEffect(() => {
    if (!open) return;
    if (districtsRef.current.length > 0) {
      setDistricts(districtsRef.current);
      return;
    }
    getDistricts(1)
      .then((data) => {
        districtsRef.current = data;
        setDistricts(data);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const set = <K extends keyof DeckFilters>(key: K, val: DeckFilters[K]) =>
    onChange({ ...filters, [key]: val });

  const toggleDistrict = (id: number) => {
    const ids = filters.districtIds.includes(id)
      ? filters.districtIds.filter((d) => d !== id)
      : [...filters.districtIds, id];
    onChange({ ...filters, districtIds: ids });
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-40 flex flex-col gap-5 overflow-y-auto rounded-t-3xl border-t-2 border-black bg-white px-5 pt-4 pb-8 shadow-[0_-4px_0_rgba(20,20,15,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] max-h-[88dvh] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
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

        {districts.length > 0 && (
          <Row label="Районы">
            {districts.map((d) => (
              <Chip
                key={d.id}
                active={filters.districtIds.includes(d.id)}
                onClick={() => toggleDistrict(d.id)}
              >
                {d.name}
              </Chip>
            ))}
          </Row>
        )}

        <Row label="Курение">
          <Chip active={filters.smokingOk === false} onClick={() => set('smokingOk', false)}>🚭 Не курят</Chip>
          <Chip active={filters.smokingOk === true}  onClick={() => set('smokingOk', true)}>🚬 Курение ок</Chip>
          <Chip active={filters.smokingOk === null}  onClick={() => set('smokingOk', null)}>Всё равно</Chip>
        </Row>

        <Row label="Питомцы">
          <Chip active={filters.petsOk === true}  onClick={() => set('petsOk', true)}>🐾 Есть питомцы</Chip>
          <Chip active={filters.petsOk === false} onClick={() => set('petsOk', false)}>🚫 Нет питомцев</Chip>
          <Chip active={filters.petsOk === null}  onClick={() => set('petsOk', null)}>Всё равно</Chip>
        </Row>

        <Row label="Гости">
          <Chip active={filters.guestsPref === 'often'}     onClick={() => set('guestsPref', 'often')}>Часто</Chip>
          <Chip active={filters.guestsPref === 'sometimes'} onClick={() => set('guestsPref', 'sometimes')}>Иногда</Chip>
          <Chip active={filters.guestsPref === 'rarely'}    onClick={() => set('guestsPref', 'rarely')}>Редко</Chip>
          <Chip active={filters.guestsPref === null}        onClick={() => set('guestsPref', null)}>Всё равно</Chip>
        </Row>

        <button
          type="button"
          onClick={() => { onApply(filters); onClose(); }}
          className="mt-1 w-full rounded-full border-2 border-black bg-accent py-3 text-sm font-black text-[#14140f] shadow-[3px_3px_0_rgba(20,20,15,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_rgba(20,20,15,0.9)] transition-all duration-100"
        >
          Применить
        </button>
      </div>
    </>
  );
}
