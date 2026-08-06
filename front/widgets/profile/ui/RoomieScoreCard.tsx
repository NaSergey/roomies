'use client';

import { Glass } from '@samasante/liquid-glass';
import type { MyProfile } from '@/shared/lib/api';
import { Card } from '@/shared/ui/Card';

const CHIP_OPTICS = { frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 };
const NEUTRAL_GLASS_BG =
  'linear-gradient(120deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 12%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.28) 100%), rgba(255,255,255,0.14)';

const MAX_SCORE = 40;

const STEPS = [
  { label: 'Добавь фото',         check: (p: MyProfile) => p.photos.length > 0 },
  { label: 'Пройди вайб-квиз',    check: (p: MyProfile) => p.quizCompleted },
  { label: 'Заполни анкету',      check: (p: MyProfile) => p.onboardingStep >= 4 },
  { label: 'Верифицируй телефон', check: () => false, future: true },
] as const;

export function RoomieScoreCard({ profile }: { profile: MyProfile }) {
  const score = profile.roomieScore;
  const pct = Math.round((score / MAX_SCORE) * 100);

  return (
    <Card className="flex flex-col gap-3 p-4">
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Roomie Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-(--text)">{score}</span>
            <span className="text-sm font-bold text-muted">/ {MAX_SCORE}</span>
          </div>
        </div>
        <Glass
          className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-black"
          // Ступени «плохо → отлично» тинтами из общей палитры: скай → фиолетовый
          // → розовый. Средняя ступень намеренно НЕ персиковая: фон приложения
          // лавандово-синий, и тёплый оранжевый тинт на нём уходит в грязно-
          // коричневый вместо персика. Вся шкала держится холодной half-палитры.
          // display — через style, а не классом: <Glass> ставит инлайновый
          // inline-block, и класс flex до элемента не доходил (текст процента
          // стоял в углу вместо центра круга). См. Card.tsx.
          style={{
            display: 'flex',
            background: pct >= 75 ? 'var(--tint-pink)' : pct >= 50 ? 'var(--tint-violet)' : 'var(--tint-sky)',
          }}
          optics={CHIP_OPTICS}
        >
          {pct}%
        </Glass>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full border-glass bg-white/10">
        {/* Полоса тонкая (2px) — тинт на ней не читался бы, поэтому заполнение
            плотное. Цвет — тёмно-синий --progress-fill, а не акцент: на светлом
            стекле карточки он даёт контраст, которого розовому не хватало. */}
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: '#090a5c' }}
        />
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-1.5">
        {STEPS.map((step) => {
          const done = step.check(profile);
          const future = 'future' in step && step.future;
          return (
            <div key={step.label} className="flex items-center gap-2">
              <Glass
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  done ? 'text-[#14140f]' : 'text-muted'
                }`}
                style={{
                  display: 'flex',
                  background: done ? 'var(--tint-pink)' : NEUTRAL_GLASS_BG,
                }}
                optics={CHIP_OPTICS}
              >
                {done ? '✓' : '○'}
              </Glass>
              <span className={`text-sm ${done ? 'font-bold text-(--text)' : 'text-muted'} ${future ? 'line-through' : ''}`}>
                {step.label}
                {future && <span className="ml-1 text-[10px] font-normal">(скоро)</span>}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
