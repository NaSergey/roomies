'use client';

interface RulesSectionProps {
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: 'rarely' | 'sometimes' | 'often';
}

const baseChip = 'rounded-full border-2 border-black px-3 py-2 text-sm font-black';
const activeChip = `${baseChip} bg-[#c8f36a] text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)]`;
const inactiveChip = `${baseChip} bg-white text-[#6f6f68]`;

const GUESTS_LABEL: Record<'rarely' | 'sometimes' | 'often', string> = {
  often: '🏠 Гости: часто',
  sometimes: '👌 Гости: иногда',
  rarely: '🤫 Гости: редко',
};

export function RulesSection({ smokingOk, petsOk, guestsPref }: RulesSectionProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className={smokingOk ? inactiveChip : activeChip}>
        {smokingOk ? '🚬 Курение ок' : '🚭 Не курят'}
      </span>
      <span className={petsOk ? activeChip : inactiveChip}>
        {petsOk ? '🐾 Питомцы ок' : '🚫 Без питомцев'}
      </span>
      <span className={inactiveChip}>{GUESTS_LABEL[guestsPref]}</span>
    </div>
  );
}
