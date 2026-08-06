'use client';

import { TELEGRAM_APP_URL } from './app-link';
import { getWebApp } from './use-telegram-web-app';

const SHARE_TEXT =
  'Ищу соседа по вайбу, а не по объявлению. Залетай — тут подбирают по образу жизни';

/**
 * Реферальная ссылка на Mini App. Код уезжает в startapp — Telegram кладёт его
 * в start_param подписанного initData, поэтому бэк получает автора приглашения
 * уже проверенным HMAC.
 *
 * Возвращает null, если базовый адрес Mini App не задан (NEXT_PUBLIC_TELEGRAM_APP_URL):
 * вести человека по битой ссылке хуже, чем не показывать кнопку вовсе — та же
 * логика, что и у самого TELEGRAM_APP_URL.
 */
export function buildReferralLink(code: string): string | null {
  if (!TELEGRAM_APP_URL || !code) return null;
  // startapp — query-параметр и у формата t.me/<bot>?startapp=, и у
  // t.me/<bot>/<app>, поэтому достаточно аккуратно приклеить его к адресу.
  const separator = TELEGRAM_APP_URL.includes('?') ? '&' : '?';
  return `${TELEGRAM_APP_URL}${separator}startapp=ref_${encodeURIComponent(code)}`;
}

/**
 * Открывает нативный диалог «поделиться» Telegram с выбором чата.
 * Вне Telegram (обычный браузер) — копирует ссылку в буфер обмена.
 * Возвращает 'shared' | 'copied' | 'failed', чтобы вызывающий показал отклик.
 */
export async function shareReferralLink(
  link: string,
): Promise<'shared' | 'copied' | 'failed'> {
  const wa = getWebApp();
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(SHARE_TEXT)}`;

  // openTelegramLink уводит на нативный шеринг, не выкидывая из Mini App.
  if (wa?.openTelegramLink) {
    wa.openTelegramLink(shareUrl);
    return 'shared';
  }

  try {
    await navigator.clipboard.writeText(link);
    return 'copied';
  } catch {
    return 'failed';
  }
}
