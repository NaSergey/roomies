'use client';

import { useState } from 'react';
import { haptic } from '@/shared/lib/telegram';

interface DateFieldProps {
  /** Дата в формате YYYY-MM-DD или пустая строка. */
  value: string;
  onChange: (next: string) => void;
  label: string;
  placeholder?: string;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

// Тот же перивинкл, что у выбранного кружка в RadioRow, — выбранная дата и
// выбранный вариант ответа должны читаться как одно и то же состояние.
const SELECTED = '#97a9ff';

// Поле выбора даты БЕЗ нативного <input type="date">. Раньше он тут был, и по
// тапу браузер раскрывал свою панель календаря — серую, с чужими шрифтами и
// кнопками «Очистить/Сегодня», которую нельзя ни покрасить, ни подвинуть.
// Здесь календарь свой: то же стекло, те же скругления и haptic, что у
// остального опросника. Значение наружу отдаётся в прежнем формате YYYY-MM-DD.
export function DateField({
  value,
  onChange,
  label,
  placeholder = 'Выбери дату',
}: DateFieldProps) {
  const selected = parseIso(value);
  const [open, setOpen] = useState(false);
  // Какой месяц показан в сетке. Открываем на выбранной дате, иначе на текущей.
  const [view, setView] = useState(() => startOfMonth(selected ?? new Date()));

  const today = startOfDay(new Date());

  function pick(day: Date) {
    haptic('light');
    onChange(toIso(day));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    haptic('light');
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-14 w-full items-center gap-3 rounded-xl border-glass bg-glass backdrop-glass px-4">
        <CalendarGlyph />
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={() => {
            haptic('light');
            // Каждое открытие начинается с актуального месяца, а не с того, где
            // пользователя оставил прошлый сеанс листания.
            setView(startOfMonth(selected ?? new Date()));
            setOpen((v) => !v);
          }}
          className="min-w-0 flex-1 truncate text-left text-base font-bold text-(--text-deep)"
        >
          {selected ? (
            formatDate(selected)
          ) : (
            <span className="opacity-45">{placeholder}</span>
          )}
        </button>

        {selected && (
          <button
            type="button"
            aria-label="Очистить дату"
            onClick={() => {
              haptic('light');
              onChange('');
              setOpen(false);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/40 text-(--text-deep) transition-all duration-150 active:scale-90 active:bg-white/60"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M1 1l8 8M9 1l-8 8" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        // Календарь раскрывается ПОД полем, в потоке: шаг и так скроллится, а
        // всплывающий поверх слой обрезался бы скроллпортом опросника.
        <div className="rounded-2xl border-glass bg-glass backdrop-glass p-3 shadow-glass">
          <div className="flex items-center justify-between px-1 pb-2">
            <MonthArrow dir="left" onClick={() => shiftMonth(-1)} />
            <span className="text-sm font-black text-(--text-deep)">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <MonthArrow dir="right" onClick={() => shiftMonth(1)} />
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                className="pb-1 text-center text-[11px] font-black text-(--text-deep) opacity-45"
              >
                {w}
              </span>
            ))}

            {buildMonthGrid(view).map((day, i) =>
              day === null ? (
                // Пустышки до первого числа: сетка должна начинаться с нужного
                // дня недели, а числа соседних месяцев тут только шумят.
                <span key={`gap-${i}`} />
              ) : (
                <DayCell
                  key={day.getTime()}
                  day={day}
                  selected={Boolean(selected) && isSameDay(day, selected!)}
                  isToday={isSameDay(day, today)}
                  // Въезд задним числом смысла не имеет — как и отрицательный бюджет.
                  disabled={day < today}
                  onPick={pick}
                />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DayCell({
  day,
  selected,
  isToday,
  disabled,
  onPick,
}: {
  day: Date;
  selected: boolean;
  isToday: boolean;
  disabled: boolean;
  onPick: (d: Date) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(day)}
      aria-pressed={selected}
      className="flex h-9 items-center justify-center rounded-full text-sm font-bold text-(--text-deep) transition-all duration-150 active:scale-90 disabled:opacity-25"
      style={
        selected
          ? { background: SELECTED, boxShadow: '0 0 10px 2px rgba(151, 169, 255, 0.75)' }
          : isToday
            ? { boxShadow: 'inset 0 0 0 1.5px rgba(151, 169, 255, 0.9)' }
            : undefined
      }
    >
      {day.getDate()}
    </button>
  );
}

function MonthArrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'left' ? 'Предыдущий месяц' : 'Следующий месяц'}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-(--text-deep) transition-all duration-150 active:scale-90 active:bg-white/60"
    >
      <svg
        width="8"
        height="13"
        viewBox="0 0 8 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={dir === 'left' ? { transform: 'scaleX(-1)' } : undefined}
      >
        <path d="M1.5 1.5 6.5 6.5 1.5 11.5" />
      </svg>
    </button>
  );
}

function CalendarGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-(--text-deep)"
      aria-hidden
    >
      <rect x="2" y="3.5" width="14" height="12.5" rx="3" />
      <path d="M2 7.5h14M6 1.5v3M12 1.5v3" />
    </svg>
  );
}

// Сетка месяца: ведущие пустышки до первого числа + сами дни.
// Неделя начинается с понедельника, поэтому воскресенье (getDay() === 0)
// переносится в конец.
function buildMonthGrid(view: Date): (Date | null)[] {
  const first = startOfMonth(view);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1),
    ),
  ];
}

// Все даты собираются из локальных полей, а не через new Date(iso) и
// toISOString(): те работают в UTC и в минусовых поясах сдвигают день назад.
function parseIso(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatDate(d: Date): string {
  return d
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/\s*г\.$/, '');
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
