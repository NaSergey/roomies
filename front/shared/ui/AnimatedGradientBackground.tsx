'use client';

import { memo } from 'react';

// Единый меш-градиентный фон всего приложения — смонтирован ОДИН раз в
// TelegramProvider, выше переключения вкладок/экранов, поэтому при навигации
// между ними компонент не перерендеривается и не пересоздаётся: фон физически
// один и тот же везде.
// Сам «дышащий» сдвиг узлов меша (advanceGradientPhase) идёт через CSS-переменные
// --g1..--g4 (globals.css) — компонент про них ничего не знает и не подписан
// на их изменение, поэтому анимация фона не требует ре-рендера этого дерева.
//
// Два слоя, а не один var(--bg): статичная часть меша (--bg-mesh) рисуется один
// раз, а перерисовывается каждый кадр транзишена только слой подвижных узлов
// (--bg-nodes) — иначе браузер гонял бы по всем слоям меша сразу.
function AnimatedGradientBackgroundBase() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0" style={{ background: 'var(--bg-mesh)' }} />
      <div className="absolute inset-0" style={{ background: 'var(--bg-nodes)' }} />
    </div>
  );
}

export const AnimatedGradientBackground = memo(AnimatedGradientBackgroundBase);
