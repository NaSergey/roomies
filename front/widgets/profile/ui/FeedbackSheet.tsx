'use client';

import { useEffect, useState } from 'react';
import { useSendFeedback } from '@/features/feedback';
import { ApiError, type FeedbackCategory } from '@/shared/lib/api';
import { haptic } from '@/shared/lib/telegram';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';

interface FeedbackSheetProps {
  open: boolean;
  onClose: () => void;
  /** Экран, с которого позвали форму — уезжает вместе с текстом. */
  screen?: string;
}

const CATEGORIES: { value: FeedbackCategory; label: string; placeholder: string }[] = [
  {
    value: 'bug',
    label: '🐞 Не работает',
    placeholder: 'Что сломалось и на каком шаге? Чем подробнее, тем быстрее починим.',
  },
  {
    value: 'idea',
    label: '💡 Есть идея',
    placeholder: 'Чего не хватает? Что стоит сделать иначе?',
  },
  {
    value: 'other',
    label: '💬 Другое',
    placeholder: 'Пиши что угодно — мы читаем всё.',
  },
];

// Бэк требует не меньше 5 символов (после обрезки пробелов) — держим тот же
// порог на клиенте, чтобы человек узнал об этом до отправки, а не из 400.
const MIN_LENGTH = 5;
const MAX_LENGTH = 2000;

export function FeedbackSheet({ open, onClose, screen }: FeedbackSheetProps) {
  const send = useSendFeedback();
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  // Каждое открытие — чистый лист: иначе шторка встречает прошлым текстом
  // и экраном благодарности от предыдущей отправки.
  useEffect(() => {
    if (!open) return;
    setCategory('bug');
    setMessage('');
    setSent(false);
    send.reset();
    // send стабилен между рендерами, в зависимости его не тащим —
    // иначе форма сбрасывалась бы на каждое изменение статуса мутации.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const trimmed = message.trim();
  const canSend = trimmed.length >= MIN_LENGTH && !send.isPending;
  const active = CATEGORIES.find((c) => c.value === category)!;

  const errorMessage =
    send.error instanceof ApiError
      ? send.error.message
      : send.error
        ? 'Не удалось отправить. Попробуй ещё раз.'
        : null;

  async function handleSend() {
    if (!canSend) return;
    haptic('light');
    try {
      await send.mutateAsync({ category, message: trimmed, screen });
      setSent(true);
    } catch {
      // Ошибку показывает errorMessage — шторку не закрываем, чтобы
      // написанный текст не пропал вместе с ней.
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} className="gap-4" label="Обратная связь">
      {sent ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-4xl" aria-hidden>
            🙏
          </span>
          <p className="text-lg font-black text-(--text)">Спасибо!</p>
          <p className="text-sm text-muted">
            Прочитаем всё. Если понадобится уточнить — напишем в Telegram.
          </p>
          <Button onClick={onClose} className="mt-3 w-full py-3 text-sm">
            Закрыть
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-(--text)">Обратная связь</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-muted underline"
            >
              Отмена
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.value}
                active={category === c.value}
                onClick={() => {
                  haptic('light');
                  setCategory(c.value);
                }}
                className="px-3 py-1.5"
              >
                {c.label}
              </Chip>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={5}
            placeholder={active.placeholder}
            aria-label="Текст обращения"
            className="min-w-0 resize-none rounded-xl border-glass bg-glass backdrop-glass px-3 py-2.5 text-sm font-bold text-(--text) outline-none ring-accent placeholder:font-normal placeholder:text-muted focus:ring-2"
          />

          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted">
              {trimmed.length < MIN_LENGTH ? 'Напиши хотя бы пару слов' : ''}
            </span>
            <span className="text-xs tabular-nums text-muted">
              {message.length}/{MAX_LENGTH}
            </span>
          </div>

          {errorMessage && (
            <p className="text-sm font-bold text-rose-500" role="alert">
              {errorMessage}
            </p>
          )}

          <Button onClick={handleSend} disabled={!canSend} className="w-full py-3 text-sm">
            {send.isPending ? 'Отправляем…' : 'Отправить'}
          </Button>
        </>
      )}
    </BottomSheet>
  );
}
