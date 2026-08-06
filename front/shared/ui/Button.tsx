'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'accent' | 'white';

// Оба варианта — одно и то же стекло, разница только в тинте: accent — брендовый
// розовый (bg-accent-glass), white — без тинта (bg-glass). Тинт низкоальфовый,
// фон сквозь кнопку виден: плотная заливка выпадала бы из стеклянного языка
// остального интерфейса.
const VARIANT: Record<ButtonVariant, string> = {
  accent: 'bg-accent-glass backdrop-glass border-glass text-(--text-on-accent)',
  white: 'bg-glass backdrop-glass border-glass text-(--text)',
};

// Единая база + цвет варианта. Размер/ширину/отступы прокидываем через className
// (намеренно НЕ в базе — иначе Tailwind-классы паддинга конфликтовали бы и
// переопределение работало бы непредсказуемо).
const BASE = 'rounded-full font-black disabled:opacity-60';

// Два стиля «нажатия»: raised — с тенью-стеклом, приподнят над фоном (основные CTA);
// flat — без тени, просто scale при нажатии (вторичные кнопки внутри карточек, напр. чат).
const PRESS = {
  raised: 'shadow-glass active:scale-95 transition-transform duration-150',
  flat: 'active:scale-95 transition-transform duration-150',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Плоский стиль (без жёсткой тени, scale при нажатии) — для кнопок внутри карточек. */
  flat?: boolean;
  /** Показать спиннер и заблокировать кнопку (для submit-кнопок форм/онбординга). */
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'accent',
  flat = false,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${BASE} ${flat ? PRESS.flat : PRESS.raised} ${VARIANT[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]"
          aria-hidden
        />
      ) : (
        children
      )}
    </button>
  );
}
