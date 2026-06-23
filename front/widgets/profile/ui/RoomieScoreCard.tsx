'use client';

import type { MyProfile } from '@/shared/lib/api';
import { Card } from '@/shared/ui/Card';

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
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black text-xl font-black shadow-[2px_2px_0_rgba(20,20,15,0.9)]"
          style={{ background: pct >= 75 ? '#c8f36a' : pct >= 50 ? '#ffd7a8' : '#ffd9e0' }}
        >
          {pct}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full border-2 border-black bg-[#f0efe9]">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-1.5">
        {STEPS.map((step) => {
          const done = step.check(profile);
          const future = 'future' in step && step.future;
          return (
            <div key={step.label} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-black text-[10px] font-black ${
                  done
                    ? 'bg-accent text-[#14140f]'
                    : future
                    ? 'bg-[#f0efe9] text-muted'
                    : 'bg-white text-muted'
                }`}
              >
                {done ? '✓' : '○'}
              </span>
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
