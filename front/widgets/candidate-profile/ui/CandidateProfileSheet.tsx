'use client';

import Image from 'next/image';
import { Glass } from '@samasante/liquid-glass';
import { useEffect, useRef, useState } from 'react';
import { VibeScaleBar } from '@/shared/ui/VibeScaleBar';
import { RulesSection } from '@/shared/ui/RulesSection';
import { MatchReasonsList } from '@/shared/ui/MatchReasonsList';
import { TAG_TINTS, SCENARIO_LABELS } from '@/shared/config';
import { ActionButtons } from '@/features/swipe-profile';
import type { ActionButtonsProps } from '@/features/swipe-profile';
import { mediaUrl } from '@/shared/lib/api';
import type { FeedCandidate } from '@/shared/lib/api';

export interface CandidateProfileSheetProps extends ActionButtonsProps {
  candidate: FeedCandidate | null;
  onClose: () => void;
}

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

  // Держим последнего кандидата, пока панель уезжает вниз — иначе при закрытии
  // (candidate становится null) контент пропадает мгновенно вместе с ранним
  // return null, и transition (тот же приём, что и в BottomSheet) не успевает
  // доиграть: сама шторка остаётся смонтированной всегда, "закрыто" — это
  // просто translate-y-full, а не размонтирование. setState прямо в рендере —
  // задокументированный React-паттерн «storing information from previous
  // renders»; useEffect тут не годится — из-за лишнего тика в самый первый
  // открытие панель бы на кадр появлялась пустой.
  const [displayCandidate, setDisplayCandidate] = useState<FeedCandidate | null>(candidate);
  if (candidate && candidate !== displayCandidate) {
    setDisplayCandidate(candidate);
  }

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

  const matchPct = displayCandidate ? Math.round(displayCandidate.matchScore * 100) : 0;
  const photo = displayCandidate?.photos[0];
  const budgetStr = displayCandidate
    ? [displayCandidate.budgetMin, displayCandidate.budgetMax].filter((v) => v != null).join('–') + ' ₽'
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
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-glass backdrop-glass border-glass shadow-glass transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] max-h-[85dvh] ${
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
          <div className="h-1 w-10 rounded-full bg-white/50" />
        </div>

        {/* Header */}
        {displayCandidate && (
          <div className="flex shrink-0 items-center gap-3 border-b border-white/15 px-5 pb-3 pt-1">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-glass shadow-glass">
              {photo ? (
                <Image src={mediaUrl(photo)} alt={displayCandidate.name} fill sizes="48px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">🏠</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-black text-(--text)">
                {displayCandidate.name}
                {displayCandidate.age != null && (
                  <span className="ml-1.5 text-base font-bold text-muted">{displayCandidate.age}</span>
                )}
              </h2>
              <p className="truncate text-xs text-muted">
                {SCENARIO_LABELS[displayCandidate.scenario] ?? displayCandidate.scenario}
              </p>
            </div>
            <Glass
              className="shrink-0 rounded-xl px-2 py-1 text-sm font-black text-[#14140f]"
              style={{ background: 'var(--tint-pink)' }}
              optics={{ frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 }}
            >
              ★ {matchPct}%
            </Glass>
          </div>
        )}

        {/* Scrollable content */}
        {displayCandidate && (
          <div className="flex-1 overflow-y-auto px-5 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col gap-5 pb-2">

              {/* ВАЙБ ДОМА */}
              {displayCandidate.lifestyleScales && (
                <Section title="Вайб дома">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                      <span>неважно</span>
                      <span>важно</span>
                    </div>
                    {(
                      ['noiseLevel', 'cleanliness', 'sleepSchedule', 'socialLevel', 'workFromHome'] as const
                    ).map((key) => (
                      <VibeScaleBar
                        key={key}
                        scaleKey={key}
                        value={displayCandidate.lifestyleScales[key]}
                        photo={photo}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {/* ПРАВИЛА */}
              <Section title="Правила">
                <RulesSection
                  smokingOk={displayCandidate.smokingOk}
                  petsOk={displayCandidate.petsOk}
                  guestsPref={displayCandidate.guestsPref}
                />
              </Section>

              {/* О СЕБЕ */}
              <Section title="О себе">
                <div className="flex flex-col gap-2">
                  {displayCandidate.districts.length > 0 && (
                    <p className="text-sm text-(--text)">
                      <span className="font-black">📍 </span>
                      {displayCandidate.districts.map((d) => d.name).join(', ')}
                    </p>
                  )}
                  {(displayCandidate.budgetMin != null || displayCandidate.budgetMax != null) && (
                    <p className="text-sm text-(--text)">
                      <span className="font-black">💸 </span>
                      {budgetStr}
                    </p>
                  )}
                  {displayCandidate.vibeTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {displayCandidate.vibeTags.map((t, i) => (
                        <Glass
                          key={t.id}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-[#14140f] ${TAG_TINTS[i % TAG_TINTS.length]}`}
                          optics={{ frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 }}
                        >
                          {t.label}
                        </Glass>
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              {/* ПОЧЕМУ ВЫ СОВПАЛИ */}
              {displayCandidate.matchReasons.length > 0 && (
                <Section title="Почему вы совпали">
                  <MatchReasonsList
                    matchReasons={displayCandidate.matchReasons}
                    matchRisks={displayCandidate.matchRisks}
                  />
                </Section>
              )}
            </div>
          </div>
        )}

        {/* Sticky footer — action buttons */}
        <div className="shrink-0 border-t border-white/15 px-5 py-3">
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
