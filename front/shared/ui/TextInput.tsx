'use client';

import type { InputHTMLAttributes } from 'react';

// Стеклянный инпут. Весь «вид» поля — рамка, фон, цвет текста, focus-ring,
// защита от переполнения — зашит в базе (раньше дублировался по всем формам).
// На месте вызова остаётся только размер/ширина/спецификой (padding,
// text-size, font-weight, w-full|flex-1, text-center, [color-scheme:light] …).
const BASE =
  'min-w-0 rounded-xl bg-glass backdrop-glass border-glass text-(--text) ' +
  'outline-none ring-accent focus:ring-2';

export function TextInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${BASE} ${className}`} {...rest} />;
}
