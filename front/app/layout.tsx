import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
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
  themeColor: '#f6f6f1',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
      <body>{children}</body>
    </html>
  );
}
