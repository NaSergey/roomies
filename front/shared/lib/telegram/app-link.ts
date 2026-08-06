// Ссылка на Mini App в Telegram — куда отправляем человека, открывшего сайт в
// обычном браузере. Задаётся через env, потому что у dev/stage/prod разные боты.
//
// Формат: https://t.me/<bot_username>/<app_short_name> (или https://t.me/<bot>?startapp).
// Переменная не задана — кнопки просто нет: вести пользователя по битой ссылке
// хуже, чем не показывать её вовсе.
export const TELEGRAM_APP_URL = process.env.NEXT_PUBLIC_TELEGRAM_APP_URL?.trim() || null;
