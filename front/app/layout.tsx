import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Golos_Text, Outfit } from 'next/font/google';
import { bim } from '@/shared/font';
import { TelegramProvider } from '@/shared/lib/telegram';
import { ReactQueryProvider } from '@/shared/lib/query';
import './globals.css';

// Glock Grotesk 2.0 — платный шрифт, в Google Fonts нет. Unbounded был слишком
// широким на жирных весах и распирал бейджи/пилюли — заменили на Golos Text,
// он спроектирован под плотный UI-набор и держит ширину на 900-м весе.
const golosText = Golos_Text({ variable: '--font-golos', subsets: ['latin', 'cyrillic'] });
// FF Providence Sans — платный, используется только для цифр возраста в карточке,
// поэтому кириллица не нужна. Outfit — близкий бесплатный гуманистический гротеск.
const outfit = Outfit({ variable: '--font-outfit', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Roomies',
  description: 'Найди соседа по вайбу',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Тёмный низ фонового меша, а не светлый верх: этим цветом клиент красит
  // зоны вокруг контента до того, как SDK применит setBackgroundColor
  // (см. use-telegram-web-app.ts). На светлом внизу мигала чужая плашка.
  themeColor: '#1f2064',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${golosText.variable} ${outfit.variable} ${geistMono.variable} ${bim.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Telegram Mini App SDK. Нативный <script> в Server Component (а не next/script):
            Next 16 + React 19 ругаются на <Script> в клиентском рендере, а серверный
            тег просто уйдёт в HTML и выполнится до гидрации. */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                var s=document.createElement('script');
                s.src='//cdn.jsdelivr.net/npm/eruda';
                s.onload=function(){eruda.init()};
                document.head.appendChild(s);
              `,
            }}
          />
        )}
      </head>
      <body><ReactQueryProvider><TelegramProvider>{children}</TelegramProvider></ReactQueryProvider></body>
    </html>
  );
}
