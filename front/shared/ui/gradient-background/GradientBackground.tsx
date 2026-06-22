'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { getRandomGradientPreset } from './presets';

interface GradientBackgroundProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

// Основные стили «стикер-бейджа» (рамка, поворот, отступы, типографика) заданы
// здесь Tailwind-классами. На месте использования передаётся только
// позиционирование через className. Инлайном идёт лишь сам градиент — он
// динамический (случайный пресет, см. presets.ts), классом его не выразить.
// Пресет выбирается один раз при монтировании (ленивый useState), чтобы при
// ре-рендерах (например, во время свайпа) он не «мигал» новыми цветами.
const BASE_CLASS =
  'border-2 border-black  px-3 py-1 text-xl font-medium text-[#111]';

export function GradientBackground({ className, style, children }: GradientBackgroundProps) {
  const [preset] = useState(getRandomGradientPreset);

  return (
    <div
      className={`${BASE_CLASS} ${className ?? ''}`.trim()}
      style={{ ...style, background: preset.css }}
    >
      {children}
    </div>
  );
}
