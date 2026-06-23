'use client';

export interface SmartChipsProps {
  onChipTap: (text: string) => void;
}

const SMART_CHIPS = [
  'Как у тебя с гостями?',
  'Тишина после 23:00?',
  'Как насчёт питомцев?',
  'Работаешь из дома?',
  'Какой у тебя режим сна?',
];

export function SmartChips({ onChipTap }: SmartChipsProps) {
  return (
    <div className="px-3 py-4 flex flex-col gap-3">
      <p className="text-xs text-muted font-black uppercase tracking-widest">
        Начни разговор
      </p>
      <div className="flex flex-wrap gap-2">
        {SMART_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onChipTap(chip)}
            className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-bold text-(--text) active:scale-95 transition-transform duration-100"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
