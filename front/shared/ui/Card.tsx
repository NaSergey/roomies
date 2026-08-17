'use client';

import { Glass } from '@samasante/liquid-glass';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { GLASS_OPTICS, GLASS_SURFACE_BG } from '@/shared/config';

// Стеклянная карточка через <Glass> (@samasante/liquid-glass) — та же
// нейтральная стеклянная подложка, что раньше давала CSS-утилита bg-glass
// (диагональный блик поверх полупрозрачной заливки), плюс настоящая
// SVG-рефракция библиотеки поверх неё.
// Раскладку/паддинг/фон-отступы оставляем на месте вызова через className.

// <Glass> проставляет СВОЙ инлайновый `display: inline-block`, а инлайн-стиль
// сильнее класса — поэтому раскладочный класс в className (flex/grid) молча не
// применялся: содержимое карточек стояло как инлайн-поток, без gap и без
// выравнивания. Достаём раскладку из className сами и отдаём её через style,
// где она перебьёт инлайновый inline-block. Остальные flex-*/grid-* классы
// (flex-col, items-center, gap-*) работают как обычно — перебивается только
// само свойство display.
const LAYOUT_CLASSES = ['inline-flex', 'inline-grid', 'flex', 'grid'] as const;

export function displayFromClassName(className: string): CSSProperties['display'] {
  const tokens = className.split(/\s+/);
  return LAYOUT_CLASSES.find((c) => tokens.includes(c));
}

export function Card({
  className = '',
  style,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const display = displayFromClassName(className);

  return (
    <Glass
      className={`rounded-2xl ${className}`}
      style={{
        background: GLASS_SURFACE_BG,
        ...(display ? { display } : null),
        ...(style as CSSProperties),
      }}
      optics={GLASS_OPTICS}
      {...rest}
    >
      {children}
    </Glass>
  );
}
