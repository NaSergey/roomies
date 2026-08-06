'use client';

import { useEffect } from 'react';

export function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function isMobilePlatform(): boolean {
  const p = getWebApp()?.platform ?? '';
  return p === 'ios' || p === 'android';
}

// Крайние тона фонового меша (--bg-mesh в globals.css). Дублируются здесь
// строками, потому что уходят в Telegram SDK, а он принимает только готовый
// hex — прочитать CSS-переменную на момент вызова нельзя.
const MESH_TOP = '#d7cfff';
const MESH_BOTTOM = '#1f2064';

// Инициализация SDK Telegram: разворачиваем Mini App и ФИКСИРУЕМ единый режим
// (expanded), чтобы приложение всегда открывалось одинаково, а не «шторкой»:
//  - expand() + disableVerticalSwipes() — нельзя схлопнуть обратно в compact;
//  - ре-expand на viewportChanged — если Telegram всё же свернул, разворачиваем.
// Тему не применяет — палитра зафиксирована в globals.css.
// --tg-safe-top считаем по честным инсетам Telegram (device + content), без
// магических констант: в expanded оба обычно 0, в fullscreen — реальные отступы.
export function useTelegramWebApp() {
  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;

    wa.ready();

    // Fullscreen — ТОЛЬКО на мобилке (иммерсивный режим без шапки Telegram).
    // На десктопе (tdesktop/macos/web) мини-апп должен жить в окне, как обычно:
    // там fullscreen растягивает на весь монитор и ведёт себя по-разному в
    // зависимости от точки входа (прямая ссылка/кнопка меню vs чат) — поэтому
    // на десктопе просто expand(), без requestFullscreen.
    // requestFullscreen существует в JS SDK всегда, но поддержан клиентом лишь
    // с Bot API 8.0 — поэтому проверяем версию, а не наличие метода, иначе
    // старые клиенты (6.0) пишут «Method ... is not supported».
    const goFullscreen = () => {
      if (isMobilePlatform() && wa.isVersionAtLeast?.('8.0') && wa.requestFullscreen) {
        if (!wa.isFullscreen) wa.requestFullscreen();
      } else {
        wa.expand();
      }
    };
    goFullscreen();
    if (wa.isVersionAtLeast?.('7.7')) wa.disableVerticalSwipes?.();

    // Цвета «рамы» Telegram вокруг нашего контента. Пока они не заданы,
    // Telegram красит эти зоны цветом темы (светлый bg_color), и под нижней
    // навигацией появлялась светлая плашка, не совпадающая с фоном приложения —
    // выглядело так, будто у панели свой фон. Берём крайние тона фонового меша:
    // шапке — светлый верх, фону и нижней полосе — тёмный низ.
    // hex принимается разными версиями Bot API, отсюда проверки.
    if (wa.isVersionAtLeast?.('6.1')) wa.setBackgroundColor?.(MESH_BOTTOM);
    if (wa.isVersionAtLeast?.('6.9')) wa.setHeaderColor?.(MESH_TOP);
    if (wa.isVersionAtLeast?.('7.10')) wa.setBottomBarColor?.(MESH_BOTTOM);

    // Safe-area: в fullscreen контент уходит под статус-бар и кнопки Telegram,
    // поэтому верхний отступ = системный вырез + зона UI Telegram.
    const applyInset = () => {
      const top = (wa.safeAreaInset?.top ?? 0) + (wa.contentSafeAreaInset?.top ?? 0);
      document.documentElement.style.setProperty('--tg-safe-top', `${top}px`);
    };
    applyInset();

    const onFullscreenFailed = () => wa.expand();

    wa.onEvent('fullscreenChanged', goFullscreen);
    wa.onEvent('fullscreenFailed', onFullscreenFailed);
    wa.onEvent('safeAreaChanged', applyInset);
    wa.onEvent('contentSafeAreaChanged', applyInset);
    return () => {
      wa.offEvent('fullscreenChanged', goFullscreen);
      wa.offEvent('fullscreenFailed', onFullscreenFailed);
      wa.offEvent('safeAreaChanged', applyInset);
      wa.offEvent('contentSafeAreaChanged', applyInset);
    };
  }, []);
}
