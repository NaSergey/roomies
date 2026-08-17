'use client';

import { useEffect, useState } from 'react';

// Поля, которые НЕ поднимают экранную клавиатуру.
const NON_TEXT_TYPES = new Set([
  'checkbox',
  'radio',
  'button',
  'submit',
  'reset',
  'file',
  'range',
  'color',
  'image',
]);

function opensKeyboard(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_TYPES.has(target.type);
  return false;
}

/**
 * Открыта ли экранная клавиатура.
 *
 * Считаем по фокусу, а не по размеру вьюпорта: на iOS внутри Telegram клавиатура
 * ужимает высоту окна, и любая эвристика вида «innerHeight минус
 * visualViewport.height» ловит заодно схлопывание самого layout — то есть
 * срабатывает уже ПОСЛЕ того, как раскладку перекорёжило. Фокус приходит раньше
 * и не зависит от того, как конкретный клиент считает высоту.
 */
// Пауза перед тем, как считать клавиатуру убранной. Фокус уходит мгновенно, а
// клавиатура уезжает примерно четверть секунды — без паузы то, что мы прячем на
// время ввода, возвращалось ПОД ещё не уехавшую клавиатуру и прыгало на месте.
const HIDE_DELAY_MS = 400;

export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const onFocusIn = (e: FocusEvent) => {
      if (!opensKeyboard(e.target)) return;
      clearTimeout(hideTimer);
      setOpen(true);
    };
    // focusout приходит и при переходе между двумя полями — проверяем, куда
    // ушёл фокус, иначе панель мигала бы между полями «бюджет от» и «до».
    const onFocusOut = (e: FocusEvent) => {
      if (opensKeyboard(e.relatedTarget)) return;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setOpen(false), HIDE_DELAY_MS);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      clearTimeout(hideTimer);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return open;
}
