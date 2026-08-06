'use client';

import { Glass } from '@samasante/liquid-glass';
import type { CSSProperties, ReactNode } from 'react';

interface RulesSectionProps {
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: 'rarely' | 'sometimes' | 'often';
}

const CHIP_OPTICS = { frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 };
const ACTIVE_BG = 'var(--tint-pink)';
const INACTIVE_BG =
  'linear-gradient(120deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 12%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.28) 100%), rgba(255,255,255,0.14)';

function RuleChip({ active, children }: { active: boolean; children: ReactNode }) {
  const style: CSSProperties = {
    background: active ? ACTIVE_BG : INACTIVE_BG,
    color: active ? '#14140f' : '#6f6f68',
  };
  return (
    <Glass className="rounded-full px-3 py-2 text-sm font-black" style={style} optics={CHIP_OPTICS}>
      {children}
    </Glass>
  );
}

const GUESTS_LABEL: Record<'rarely' | 'sometimes' | 'often', string> = {
  often: '🏠 Гости: часто',
  sometimes: '👌 Гости: иногда',
  rarely: '🤫 Гости: редко',
};

export function RulesSection({ smokingOk, petsOk, guestsPref }: RulesSectionProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <RuleChip active={!smokingOk}>{smokingOk ? '🚬 Курение ок' : '🚭 Не курят'}</RuleChip>
      <RuleChip active={petsOk}>{petsOk ? '🐾 Питомцы ок' : '🚫 Без питомцев'}</RuleChip>
      <RuleChip active={false}>{GUESTS_LABEL[guestsPref]}</RuleChip>
    </div>
  );
}
