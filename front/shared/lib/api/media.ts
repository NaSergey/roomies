import { API_BASE_URL } from './config';

// Фото профилей отдаёт бэк по относительному пути (/uploads/...), а хост
// подставляется здесь, на клиенте. Так ссылка не запоминает адрес dev-туннеля:
// его имя эфемерное и меняется при каждом перезапуске, а раньше хост вмерзал в
// сохранённый URL и все ранее загруженные фото после перезапуска отваливались.
//
// Абсолютные ссылки пропускаем как есть: это либо аватарки из Telegram
// (t.me/cdn), либо сидовые фото с внешних хостов, либо старые записи в БД,
// сохранённые ещё вместе с хостом.
export function mediaUrl(url: string): string;
export function mediaUrl(url: string | null | undefined): string | null;
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return url;
}
