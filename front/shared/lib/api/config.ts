// Базовый URL бэка. Для Telegram Mini App это всегда абсолютный адрес,
// потому что Mini App открывается с другого origin (cloudflare-туннель / прод).
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
