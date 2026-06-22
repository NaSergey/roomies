'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { VibeScaleBar } from '@/shared/ui/vibe-scale-bar';
import { RulesSection } from '@/shared/ui/rules-section';
import { MatchReasonsList } from '@/shared/ui/match-reasons-list';
import { ActionButtons } from '@/features/swipe-profile';
import type { ActionButtonsProps } from '@/features/swipe-profile';
import type { FeedCandidate } from '@/shared/lib/api';

export interface CandidateProfileSheetProps extends ActionButtonsProps {
  candidate: FeedCandidate | null;
  onClose: () => void;
}

const BUDGET_SCENARIOS: Record<string, string> = {
  looking_housing_roomie: 'Ищет жильё + соседа',
  has_housing_seeking_roomie: 'Сдаёт комнату',
  looking_roomie_only: 'Ищет соседа',
  flexible: 'Любой вариант',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted">{title}</span>
      {children}
    </div>
  );
}

export function CandidateProfileSheet({
  candidate,
  onClose,
  onPass,
  onLike,
  onSave,
  onSuperLike,
}: CandidateProfileSheetProps) {
  const open = candidate !== null;
  const handleRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const isDraggingHandle = useRef(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  function handleHandlePointerDown(e: React.PointerEvent) {
    isDraggingHandle.current = true;
    dragStartY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleHandlePointerMove(e: React.PointerEvent) {
    if (!isDraggingHandle.current) return;
    if (e.clientY - dragStartY.current > 80) {
      isDraggingHandle.current = false;
      onClose();
    }
  }

  function handleHandlePointerUp() {
    isDraggingHandle.current = false;
  }

  if (!candidate && !open) return null;

  const matchPct = candidate ? Math.round(candidate.matchScore * 100) : 0;
  const photo = candidate?.photos[0];
  const budgetStr = candidate
    ? [candidate.budgetMin, candidate.budgetMax].filter((v) => v != null).join('–') + ' ₽'
    : '';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border-t-2 border-black bg-white shadow-[0_-4px_0_rgba(20,20,15,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] max-h-[92dvh] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div
          ref={handleRef}
          className="flex shrink-0 cursor-grab touch-none items-center justify-center pb-1 pt-3 active:cursor-grabbing"
          onPointerDown={handleHandlePointerDown}
          onPointerMove={handleHandlePointerMove}
          onPointerUp={handleHandlePointerUp}
          onPointerCancel={handleHandlePointerUp}
        >
          <div className="h-1 w-10 rounded-full bg-[#d0d0cc]" />
        </div>

        {/* Header */}
        {candidate && (
          <div className="flex shrink-0 items-center gap-3 border-b-2 border-[#f0efe9] px-5 pb-3 pt-1">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-black shadow-[2px_2px_0_rgba(20,20,15,0.9)]">
              {photo ? (
                <Image src={photo} alt={candidate.name} fill sizes="48px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">🏠</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-black text-(--text)">
                {candidate.name}
                {candidate.age != null && (
                  <span className="ml-1.5 text-base font-bold text-muted">{candidate.age}</span>
                )}
              </h2>
              <p className="truncate text-xs text-muted">
                {BUDGET_SCENARIOS[candidate.scenario] ?? candidate.scenario}
              </p>
            </div>
            <span className="shrink-0 rounded-xl border-2 border-black bg-accent px-2 py-1 text-sm font-black text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)]">
              ★ {matchPct}%
            </span>
          </div>
        )}

        {/* Scrollable content */}
        {candidate && (
          <div className="flex-1 overflow-y-auto px-5 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col gap-5 pb-2">

              {/* ВАЙБ ДОМА */}
              {candidate.lifestyleScales && (
                <Section title="Вайб дома">
                  <div className="flex flex-col gap-3">
                    {(
                      ['noiseLevel', 'cleanliness', 'sleepSchedule', 'socialLevel', 'workFromHome'] as const
                    ).map((key) => (
                      <VibeScaleBar key={key} scaleKey={key} value={candidate.lifestyleScales[key]} />
                    ))}
                  </div>
                </Section>
              )}

              {/* ПРАВИЛА */}
              <Section title="Правила">
                <RulesSection
                  smokingOk={candidate.smokingOk}
                  petsOk={candidate.petsOk}
                  guestsPref={candidate.guestsPref}
                />
              </Section>

              {/* О СЕБЕ */}
              <Section title="О себе">
                <div className="flex flex-col gap-2">
                  {candidate.districts.length > 0 && (
                    <p className="text-sm text-(--text)">
                      <span className="font-black">📍 </span>
                      {candidate.districts.map((d) => d.name).join(', ')}
                    </p>
                  )}
                  {(candidate.budgetMin != null || candidate.budgetMax != null) && (
                    <p className="text-sm text-(--text)">
                      <span className="font-black">💸 </span>
                      {budgetStr}
                    </p>
                  )}
                  {candidate.vibeTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {candidate.vibeTags.map((t, i) => (
                        <span
                          key={t.id}
                          className={`rounded-full border-2 border-black px-2.5 py-0.5 text-xs font-bold text-[#14140f] ${
                            ['bg-[#c8f36a]', 'bg-[#a8d8ff]', 'bg-[#ffb8d4]'][i % 3]
                          }`}
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              {/* ПОЧЕМУ ВЫ СОВПАЛИ */}
              {candidate.matchReasons.length > 0 && (
                <Section title="Почему вы совпали">
                  <MatchReasonsList
                    matchReasons={candidate.matchReasons}
                    matchRisks={candidate.matchRisks}
                  />
                </Section>
              )}
            </div>
          </div>
        )}

        {/* Sticky footer — action buttons */}
        <div className="shrink-0 border-t-2 border-[#f0efe9] px-5 py-3">
          <ActionButtons
            onPass={onPass}
            onLike={onLike}
            onSave={onSave}
            onSuperLike={onSuperLike}
          />
        </div>
      </div>
    </>
  );
}
