'use client';

// Анимированный фон «как в Telegram»: 4 цветных пятна (radial-gradient),
// чьи позиции плавно едут при каждом триггере — эффект «дыхания» фона при
// отправке сообщения в Telegram. Реализовано чисто на CSS: координаты пятен —
// зарегистрированные через @property CSS-переменные (globals.css), поэтому
// браузер сам интерполирует проценты при смене значения — цикла requestAnimationFrame
// не нужно, достаточно один раз выставить новые var(...) через setProperty.
//
// Каждое пятно ходит по небольшому эллипсу вокруг своей «домашней» точки —
// шаг угла на свайп маленький (STEP_DEGREES), поэтому сдвиг позиции между
// соседними свайпами небольшой и плавный, а не прыжок в произвольную точку
// экрана. Значения ниже согласованы с initial-value в globals.css (там —
// позиция при angle=0).
interface OrbitPoint {
  key: string;
  cx: number; // центр орбиты, % по X
  cy: number; // центр орбиты, % по Y
  rx: number; // радиус орбиты по X, % (небольшой — это и даёт маленький шаг)
  ry: number; // радиус орбиты по Y, %
  dir: 1 | -1; // направление вращения — не все пятна крутятся синхронно
}

const POINTS: readonly OrbitPoint[] = [
  { key: 'g1', cx: 22, cy: 25, rx: 12, ry: 10, dir: 1 },
  { key: 'g2', cx: 78, cy: 22, rx: 10, ry: 12, dir: -1 },
  { key: 'g3', cx: 25, cy: 78, rx: 12, ry: 10, dir: -1 },
  { key: 'g4', cx: 75, cy: 75, rx: 10, ry: 12, dir: 1 },
];

const STEP_DEGREES = 32; // маленький шаг за свайп — полный оборот примерно за 11 свайпов

let angleDeg = 0;

function applyAngle(deg: number) {
  const root = document.documentElement;
  for (const p of POINTS) {
    const rad = (deg * p.dir * Math.PI) / 180;
    const x = p.cx + p.rx * Math.cos(rad);
    const y = p.cy + p.ry * Math.sin(rad);
    root.style.setProperty(`--${p.key}x`, `${x.toFixed(1)}%`);
    root.style.setProperty(`--${p.key}y`, `${y.toFixed(1)}%`);
  }
}

/** Сдвигает фоновые пятна на маленький шаг по их орбитам. Вызывать на каждый свайп. */
export function advanceGradientPhase() {
  angleDeg = (angleDeg + STEP_DEGREES) % 360;
  applyAngle(angleDeg);
}
