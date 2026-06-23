'use client';

import type { InputHTMLAttributes } from 'react';

// Поле ввода в необруталистском стиле. База — только инвариант рамки; фон, паддинг,
// шрифт и focus-ring задаём через className на месте (они отличаются по формам,
// а в базе конфликтовали бы по Tailwind-приоритету).
const BASE = 'rounded-xl border-2 border-black outline-none';

export function TextField({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${BASE} ${className}`} {...rest} />;
}
