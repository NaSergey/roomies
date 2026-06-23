'use client';

import { useEffect, useRef, useState } from 'react';
import { getDistricts, type District } from '@/shared/lib/api';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';

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
    <BottomSheet open={open} onClose={onClose} className="gap-5" label="Фильтры">
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

        <Button onClick={() => { onApply(filters); onClose(); }} className="mt-1 w-full py-3 text-sm">
          Применить
        </Button>
    </BottomSheet>
  );
}
