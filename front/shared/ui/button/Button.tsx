'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'accent' | 'white';

const VARIANT: Record<ButtonVariant, string> = {
  accent: 'bg-accent text-(--text-on-accent)',
  white: 'bg-white text-(--text)',
};

// Необруталистская кнопка: единый бордер + цвет варианта. Размер/ширину/отступы
// прокидываем через className (намеренно НЕ в базе — иначе Tailwind-классы паддинга
// конфликтовали бы и переопределение работало бы непредсказуемо).
const BASE = 'rounded-full border-2 border-black font-black disabled:opacity-60';

// Два стиля «нажатия»: raised — жёсткая тень + вдавливание (основные CTA);
// flat — без тени, scale при нажатии (вторичные кнопки внутри карточек, напр. чат).
const PRESS = {
  raised:
    'shadow-[2px_2px_0_rgba(20,20,15,0.9)] ' +
    'active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] ' +
    'transition-all duration-100',
  flat: 'active:scale-95 transition-transform duration-100',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Плоский стиль (без жёсткой тени, scale при нажатии) — для кнопок внутри карточек. */
  flat?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'accent',
  flat = false,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${flat ? PRESS.flat : PRESS.raised} ${VARIANT[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
