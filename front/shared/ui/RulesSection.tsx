'use client';

import { Glass } from '@samasante/liquid-glass';
import type { CSSProperties, ReactNode } from 'react';
import { GLASS_OPTICS, GLASS_SURFACE_BG } from '@/shared/config';

interface RulesSectionProps {
  /** Терпимость: «мне ок, если сосед курит». */
  smokingOk: boolean;
  /** Терпимость: «мне ок, если у соседа питомец». */
  petsOk: boolean;
  /** Факт: «я курю». */
  smokes: boolean;
  /** Факт: «у меня есть питомец». */
  hasPets: boolean;
  guestsPref: 'rarely' | 'sometimes' | 'often';
}

const ACTIVE_BG = 'var(--tint-pink)';

function RuleChip({ active, children }: { active: boolean; children: ReactNode }) {
  const style: CSSProperties = {
    background: active ? ACTIVE_BG : GLASS_SURFACE_BG,
    // Через переменные, а не хардкодом: это был последний экземпляр серого
    // #6f6f68 мимо палитры — на чипе «Гости: иногда» он и читался чужим.
    color: active ? 'var(--text)' : 'var(--text-muted)',
  };
  return (
    <Glass className="rounded-full px-3 py-2 text-sm font-black" style={style} optics={GLASS_OPTICS}>
      {children}
    </Glass>
  );
}

const GUESTS_LABEL: Record<'rarely' | 'sometimes' | 'often', string> = {
  often: '🏠 Гости: часто',
  sometimes: '👌 Гости: иногда',
  rarely: '🤫 Гости: редко',
};

// Один чип на тему, но три состояния вместо двух: сначала факт (курит /
// держит питомца), и только для тех, кто не курит и никого не держит, —
// уточнение про терпимость. Раньше чип стоял на одной галочке и «🚭 Не курят»
// показывалось всякому, кто просто не терпит курение, включая курящих.
function smokingLabel(smokes: boolean, smokingOk: boolean): string {
  if (smokes) return '🚬 Курит';
  return smokingOk ? '🚭 Не курит' : '🚭 Не курит, и рядом тоже';
}

function petsLabel(hasPets: boolean, petsOk: boolean): string {
  if (hasPets) return '🐾 Есть питомец';
  return petsOk ? '🐾 Питомцы ок' : '🚫 Без питомцев';
}

export function RulesSection({
  smokingOk,
  petsOk,
  smokes,
  hasPets,
  guestsPref,
}: RulesSectionProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <RuleChip active={!smokes}>{smokingLabel(smokes, smokingOk)}</RuleChip>
      <RuleChip active={hasPets || petsOk}>{petsLabel(hasPets, petsOk)}</RuleChip>
      <RuleChip active={false}>{GUESTS_LABEL[guestsPref]}</RuleChip>
    </div>
  );
}
