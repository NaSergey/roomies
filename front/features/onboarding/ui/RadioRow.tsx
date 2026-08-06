'use client';

import { haptic } from '@/shared/lib/telegram';

interface RadioRowProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  /** Вторая строка-пояснение, как «(до 23:00 / до 7:00)» в макете. */
  hint?: string;
  /** true — чекбокс (можно выбрать несколько), меняет только семантику. */
  multiple?: boolean;
}

// Цвет выбранного кружка — тот же перивинкл, что у ключей в шапке.
const SELECTED = '#97a9ff';

// Небольшое свечение вокруг кружка: box-shadow без смещения, размытый,
// в цвет самого кружка. Даёт мягкий ореол, а не жёсткую тень.
const GLOW_SELECTED = '0 0 10px 2px rgba(151, 169, 255, 0.75)';
const GLOW_IDLE = '0 0 8px 2px rgba(255, 255, 255, 0.55)';

// Строка выбора из макета: кружок слева, название и пояснение справа.
// Намеренно БЕЗ карточки/рамки — в макете варианты лежат прямо на фоне,
// карточками (Chip/Card) они были в старом дизайне.
export function RadioRow({
  selected,
  onSelect,
  label,
  hint,
  multiple = false,
}: RadioRowProps) {
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={() => {
        haptic('light');
        onSelect();
      }}
      className="flex w-full items-start gap-3.5 py-2 text-left transition-transform duration-150 active:scale-[0.99]"
    >
      <span
        aria-hidden
        className="mt-0.5 h-6 w-6 shrink-0 rounded-full transition-all duration-200"
        style={{
          background: selected ? SELECTED : '#ffffff',
          boxShadow: selected ? GLOW_SELECTED : GLOW_IDLE,
        }}
      />
      {/* Метрики по спеке макета: 20px, вес 400, line-height 100%,
          letter-spacing 0. leading-trim в CSS пока нет — игнорируем. */}
      <span className="min-w-0">
        <span className="block text-[20px] font-normal leading-none tracking-normal text-(--text-deep)">
          {label}
        </span>
        {hint && (
          <span className="mt-1.5 block text-[15px] font-normal leading-none tracking-normal text-(--text-deep) opacity-65">
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}
