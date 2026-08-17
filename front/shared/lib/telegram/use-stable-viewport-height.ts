'use client';

import { useEffect } from 'react';
import { getWebApp } from './use-telegram-web-app';

/**
 * Держит в `--app-height` высоту экрана БЕЗ клавиатуры.
 *
 * Telegram на iOS при появлении клавиатуры ужимает сам webview, поэтому
 * уменьшается всё сразу: `innerHeight`, `100dvh` и даже `100lvh`, а
 * `viewportStableHeight` на практике тоже приезжает уменьшенным. Любая величина,
 * которую отдаёт клиент, в этот момент врёт — поэтому не спрашиваем «какая
 * высота сейчас», а запоминаем максимум виденного. Клавиатура может высоту
 * только отнять, значит максимум и есть высота экрана.
 *
 * Максимум сбрасывается при смене ориентации: там меняется ширина, и
 * накопленное значение относится уже к другому экрану.
 */
export function useStableViewportHeight(): void {
  useEffect(() => {
    const root = document.documentElement;
    let maxHeight = 0;
    let lastWidth = window.innerWidth;

    const apply = () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        maxHeight = 0;
      }

      const wa = getWebApp();
      const height = Math.max(
        window.innerHeight,
        wa?.viewportStableHeight ?? 0,
        wa?.viewportHeight ?? 0,
      );

      if (height > maxHeight) {
        maxHeight = height;
        root.style.setProperty('--app-height', `${maxHeight}px`);
      }
    };

    apply();

    const wa = getWebApp();
    wa?.onEvent('viewportChanged', apply);
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      wa?.offEvent('viewportChanged', apply);
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);
}
