import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

// Фото профилей отдаёт наш же бэкенд (/uploads/...), а его хост не фиксирован:
// в dev это эфемерный Cloudflare-туннель, который меняется при каждом запуске
// dev-tunnel.ps1, в проде — реальный домен из окружения. Поэтому паттерн для
// next/image выводим из NEXT_PUBLIC_API_URL, а не держим списком хостов.
function apiRemotePattern(): RemotePattern[] {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];
  try {
    const { protocol, hostname, port } = new URL(apiUrl);
    return [
      {
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
        ...(port ? { port } : {}),
      },
    ];
  } catch {
    // Кривой URL в окружении не должен ронять сборку — просто не добавляем
    // паттерн, и картинка упадёт на понятной ошибке next/image.
    return [];
  }
}

const nextConfig: NextConfig = {
  // Разрешаем dev-серверу принимать запросы через Cloudflare-туннель.
  // URL эфемерный (territory-view-align-linda.trycloudflare.com и т.п.),
  // поэтому wildcard на весь домен.
  allowedDevOrigins: ['*.trycloudflare.com'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      ...apiRemotePattern(),
      // Туннели по обоим протоколам: URL фото сохраняется в БД абсолютным, и
      // после перезапуска туннеля в базе остаются ссылки на прошлый хост (а он
      // мог быть и http). Без wildcard такие карточки роняли бы экран целиком.
      { protocol: 'https', hostname: '**.trycloudflare.com' },
      { protocol: 'http', hostname: '**.trycloudflare.com' },
    ],
  },
};

export default nextConfig;
