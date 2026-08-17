'use client';

// JWT зеркалим в localStorage, но источником истины держим переменную в памяти:
// в WebView Telegram запись в хранилище может молча не сохраниться (приватный
// или партиционированный контекст). Раньше это выглядело так: вход проходил
// успешно, статус становился 'authenticated' — а apiFetch читал пустой
// localStorage и слал запросы без заголовка, получая «Missing bearer token».
const TOKEN_KEY = 'roomies.accessToken';

let cachedToken: string | null = null;
// Отдельный флаг, а не проверка на null: «в хранилище пусто» — тоже ответ,
// и перечитывать localStorage на каждый запрос незачем.
let storageRead = false;

// apiFetch вычищает токен на 401 из ЛЮБОГО места приложения. Без уведомления
// useAppAuth оставался в 'authenticated' и продолжал рендерить экран, на
// котором человек находился, — а запросы с него уже уходили без токена.
const clearListeners = new Set<() => void>();

export function getAccessToken(): string | null {
  if (cachedToken !== null) return cachedToken;
  if (storageRead || typeof window === 'undefined') return null;

  storageRead = true;
  try {
    cachedToken = window.localStorage.getItem(TOKEN_KEY);
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export function setAccessToken(token: string): void {
  cachedToken = token;
  storageRead = true;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Хранилище недоступно — сессия не переживёт перезагрузку, но приложение
    // в этом запуске работает: токен лежит в памяти и уходит в заголовке.
  }
}

export function clearAccessToken(): void {
  const hadToken = getAccessToken() !== null;

  cachedToken = null;
  storageRead = true;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // см. setAccessToken
    }
  }

  if (hadToken) clearListeners.forEach((listener) => listener());
}

// Возвращает функцию отписки — для useEffect.
export function onAccessTokenCleared(listener: () => void): () => void {
  clearListeners.add(listener);
  return () => {
    clearListeners.delete(listener);
  };
}
