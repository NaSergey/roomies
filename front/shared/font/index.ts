import localFont from 'next/font/local';

/**
 * Bim (начертание Kolobov) — шрифт опросных экранов (онбординг, вайб-квиз).
 * Не Google Font, поэтому подключается файлом через next/font/local: Next сам
 * захэширует его в static-ассеты, отдаст с того же домена и вставит preload —
 * без FOUT и без запросов на сторонние CDN (важно для Telegram WebView).
 *
 * Берём только .woff2: он поддерживается везде, где вообще запускается Telegram
 * Mini App, а next/font/local не умеет складывать несколько форматов в один
 * @font-face — второй файл создал бы дублирующее правило, а не фолбэк.
 * .woff лежит рядом как исходник на случай, если понадобится другой пайплайн.
 *
 * Переменная подставляется в --font-quiz в globals.css.
 */
export const bim = localFont({
  src: './Bim-Kolobov.woff2',
  variable: '--font-bim',
  display: 'swap',
  // Метрики фолбэка: пока Bim грузится, текст рисуется системным гротеском —
  // Next подгонит его так, чтобы подмена не сдвигала вёрстку.
  adjustFontFallback: 'Arial',
});
