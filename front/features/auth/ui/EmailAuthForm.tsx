'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { TELEGRAM_APP_URL, getWebApp } from '@/shared/lib/telegram';
import { Button } from '@/shared/ui/Button';
import { TextInput } from '@/shared/ui/TextInput';

interface EmailAuthFormProps {
  loading: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  /** Вход по initData — работает, когда приложение уже открыто внутри Telegram. */
  onTelegramLogin: () => Promise<void>;
  /** Погасить ошибку прошлой попытки: она перестаёт быть правдой, как только правят поля. */
  onClearError: () => void;
}

type Mode = 'login' | 'register';
type FieldErrors = { email?: string; password?: string; name?: string };

const MIN_PASSWORD_LENGTH = 8;
// Достаточно строгая проверка, чтобы поймать опечатку до запроса; финальное
// слово всё равно за @IsEmail() на бэке.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(mode: Mode, email: string, password: string, name: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = 'Введи email';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Похоже, email введён с ошибкой';

  if (!password) errors.password = 'Введи пароль';
  else if (mode === 'register' && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Минимум ${MIN_PASSWORD_LENGTH} символов (сейчас ${password.length})`;
  }

  if (mode === 'register') {
    if (!name.trim()) errors.name = 'Введи имя';
    else if (name.trim().length < 2) errors.name = 'Имя не короче 2 символов';
  }
  return errors;
}

// Экран входа/регистрации для случая, когда приложение открыто НЕ из Telegram
// (обычный браузер — там нет initData, поэтому нужен отдельный, независимый
// от Telegram способ авторизации: email + пароль).
export function EmailAuthForm({
  loading,
  error,
  onLogin,
  onRegister,
  onTelegramLogin,
  onClearError,
}: EmailAuthFormProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // Считаем ПОСЛЕ монтирования: window.Telegram на сервере нет, и вычисление
  // прямо в рендере разошлось бы между SSR-разметкой и гидрацией.
  const [insideTelegram, setInsideTelegram] = useState(false);

  useEffect(() => {
    setInsideTelegram(Boolean(getWebApp()?.initData));
  }, []);
  // Показываем ошибки полей только после первой попытки отправки, чтобы не
  // ругаться на forme, которую ещё не начали заполнять.
  const [submitted, setSubmitted] = useState(false);

  const fieldErrors = validate(mode, email, password, name);
  const shownErrors: FieldErrors = submitted ? fieldErrors : {};

  function switchMode(next: Mode) {
    // Ответ сервера относился к прошлому режиму («Неверный email или пароль»
    // на вкладке регистрации — бессмыслица), поэтому гасим его вместе с режимом.
    onClearError();
    setMode(next);
    setSubmitted(false);
  }

  // Ошибка сервера описывает КОНКРЕТНУЮ прошлую попытку. Как только пользователь
  // начал править поля, она устарела — держать её на экране нельзя: рядом с
  // «Введи пароль» повисает «Неверный email или пароль» от прошлого сабмита.
  function edit(setter: (v: string) => void) {
    return (value: string) => {
      if (error) onClearError();
      setter(value);
    };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    // Кнопка НЕ disabled: нажатие всегда даёт отклик — либо запрос, либо
    // подсветку того, что именно не заполнено.
    setSubmitted(true);
    if (Object.keys(fieldErrors).length > 0) {
      // Форма даже не ушла на сервер — показываем только подписи под полями.
      onClearError();
      return;
    }

    if (mode === 'login') {
      onLogin(email.trim(), password).catch(() => {});
    } else {
      onRegister(email.trim(), password, name.trim()).catch(() => {});
    }
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-md flex-col px-4 py-6">
      <div className="flex flex-1 flex-col justify-center gap-4">
        <div className="text-center">
          <span className="text-5xl" aria-hidden="true">
            🏠
          </span>
          <h1 className="mt-3 text-2xl font-black text-(--text)">
            {mode === 'login' ? 'С возвращением' : 'Создать аккаунт'}
          </h1>
        </div>

        {/* Переключатель режима: раньше был мелкой ссылкой внизу, и до
            регистрации было неочевидно как добраться. */}
        <div
          role="tablist"
          className="flex gap-1 rounded-full border-glass bg-glass backdrop-glass p-1"
        >
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`flex-1 rounded-full py-2.5 text-sm font-black transition-colors ${
                mode === m
                  ? 'bg-accent-glass backdrop-glass text-(--text-on-accent)'
                  : 'text-muted'
              }`}
            >
              {m === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          {mode === 'register' && (
            <Field error={shownErrors.name}>
              <TextInput
                type="text"
                maxLength={100}
                value={name}
                onChange={(e) => edit(setName)(e.target.value)}
                placeholder="Как тебя зовут?"
                className="h-14 w-full px-4 text-base font-bold"
                autoComplete="name"
                aria-invalid={Boolean(shownErrors.name)}
              />
            </Field>
          )}

          <Field error={shownErrors.email}>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => edit(setEmail)(e.target.value)}
              placeholder="Email"
              className="h-14 w-full px-4 text-base font-bold"
              autoComplete="email"
              aria-invalid={Boolean(shownErrors.email)}
            />
          </Field>

          <Field
            error={shownErrors.password}
            hint={mode === 'register' ? `Минимум ${MIN_PASSWORD_LENGTH} символов` : undefined}
          >
            <TextInput
              type="password"
              value={password}
              onChange={(e) => edit(setPassword)(e.target.value)}
              placeholder="Пароль"
              className="h-14 w-full px-4 text-base font-bold"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(shownErrors.password)}
            />
          </Field>

          {error && (
            <p className="text-sm font-bold text-rose-500" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            loading={loading}
            className="mt-2 h-14 w-full text-base"
          >
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        {/* Вход через Telegram — основной сценарий приложения: авторизация идёт
            по initData, пароля нет вообще. Показываем в обоих режимах, потому что
            для Telegram «войти» и «зарегистрироваться» — одно и то же действие:
            аккаунт заводится при первом входе. */}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-(--text-muted)/30" />
          <span className="text-xs font-bold text-muted">или</span>
          <span className="h-px flex-1 bg-(--text-muted)/30" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          {insideTelegram ? (
            // Мы уже внутри Telegram (например, после выхода из аккаунта):
            // initData под рукой, никуда уходить не нужно — логинимся на месте.
            <Button
              type="button"
              variant="white"
              loading={loading}
              onClick={() => {
                onClearError();
                onTelegramLogin().catch(() => {});
              }}
              className="flex h-14 w-full items-center justify-center gap-2 text-base"
            >
              <TelegramGlyph />
              {mode === 'login' ? 'Войти через Telegram' : 'Продолжить через Telegram'}
            </Button>
          ) : (
            // Обычный браузер: initData взять неоткуда, поэтому отправляем в
            // Mini App. Адрес не задан — кнопка остаётся на месте и объясняет,
            // что делать, вместо перехода по битой ссылке.
            <TelegramLinkButton mode={mode} onMissingUrl={onClearError} />
          )}
          <span className="text-xs font-bold text-muted">Рекомендуем</span>
        </div>
      </div>
    </main>
  );
}

function TelegramLinkButton({
  mode,
  onMissingUrl,
}: {
  mode: Mode;
  onMissingUrl: () => void;
}) {
  const [hint, setHint] = useState(false);
  const label = mode === 'login' ? 'Войти через Telegram' : 'Продолжить через Telegram';
  const className =
    'flex h-14 w-full items-center justify-center gap-2 rounded-full border-glass bg-glass backdrop-glass text-base font-black text-(--text) shadow-glass active:scale-95 transition-transform duration-150';

  if (TELEGRAM_APP_URL) {
    return (
      <a href={TELEGRAM_APP_URL} target="_blank" rel="noopener noreferrer" className={className}>
        <TelegramGlyph />
        {label}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onMissingUrl();
          setHint(true);
        }}
        className={className}
      >
        <TelegramGlyph />
        {label}
      </button>
      {hint && (
        <p className="px-1 text-center text-xs text-muted" role="status">
          Найди нашего бота в Telegram и открой приложение оттуда — вход будет без пароля.
        </p>
      )}
    </>
  );
}

// Инпут + ОДНА подпись под ним: ошибка и подсказка взаимоисключающие, иначе под
// полем копятся два текста сразу.
function Field({
  error,
  hint,
  children,
}: {
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {children}
      {error ? (
        <p className="px-1 text-xs font-bold text-rose-500" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="px-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function TelegramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.3 18.9 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.1 13.1l-4.5-1.4c-1-.3-1-1 .2-1.4l17.6-6.8c.8-.3 1.5.2 1.2 1.4z" />
    </svg>
  );
}
