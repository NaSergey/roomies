'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ActionButtons,
  SwipeCard,
  useSwipeDeck,
  useFeedQuery,
  useSwipeMutation,
  type FeedQueryParams,
} from '@/features/swipe-profile';
import type { SwipeDirection } from '@/features/swipe-profile';
import type { FeedCandidate } from '@/shared/lib/api';
import { CandidateProfileSheet } from '@/widgets/candidate-profile';
import { DeckToolbar } from './DeckToolbar';
import { EmptyState } from './EmptyState';
import { FilterSheet, DEFAULT_FILTERS } from './FilterSheet';
import type { DeckFilters } from './FilterSheet';

function filtersToQueryParams(f: DeckFilters): FeedQueryParams {
  const params: FeedQueryParams = {};
  if (f.budget === 'low') { params.budgetMax = 20000; }
  if (f.budget === 'mid') { params.budgetMin = 20000; params.budgetMax = 35000; }
  if (f.budget === 'high') { params.budgetMin = 35000; }
  if (f.districtIds.length > 0) params.districtIds = f.districtIds;
  if (f.smokingOk !== null) params.smokingOk = f.smokingOk;
  if (f.petsOk !== null) params.petsOk = f.petsOk;
  if (f.guestsPref !== null) params.guestsPref = f.guestsPref;
  return params;
}

export function SwipeDeck() {
  const [filters, setFilters] = useState<DeckFilters>(DEFAULT_FILTERS);
  const [queryParams, setQueryParams] = useState<FeedQueryParams>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [boosted, setBoosted] = useState(false);
  const [matchState, setMatchState] = useState<{ candidateName: string; matchId: number } | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<FeedCandidate | null>(null);

  const { data: profiles = [], isLoading, isError, error, refetch } = useFeedQuery(queryParams);
  const swipeMutation = useSwipeMutation();

  const cardEls = useRef<Map<number, HTMLDivElement | null>>(new Map());

  const { visible, exitDirection, enterDirection, isEmpty, swipe, reset } = useSwipeDeck(profiles);

  const handleApplyFilters = useCallback((f: DeckFilters) => {
    setFilters(f);
    setQueryParams(filtersToQueryParams(f));
  }, []);

  const handleAction = useCallback(
    async (action: 'like' | 'pass' | 'save' | 'super_like') => {
      const currentProfile = visible[0];
      if (!currentProfile) return;

      const swipeDir: SwipeDirection = action === 'pass' ? 'left' : 'right';
      if (!swipe(swipeDir)) return;

      const result = await swipeMutation.mutateAsync({ targetId: currentProfile.id, action });
      if (result.matched && result.matchId != null) {
        setMatchState({ candidateName: currentProfile.name, matchId: result.matchId });
      }
    },
    [visible, swipe, swipeMutation],
  );

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => handleAction(direction === 'right' ? 'like' : 'pass'),
    [handleAction],
  );

  const handleReset = useCallback(async () => {
    await refetch();
    reset();
  }, [reset, refetch]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : String(error);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-3xl">⚠️</p>
        <p className="text-sm font-semibold text-(--text)">Не удалось загрузить ленту</p>
        <p className="text-xs text-muted">{msg}</p>
        <button type="button" onClick={() => refetch()} className="mt-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-(--text-on-accent)">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <DeckToolbar
        filters={filters}
        boosted={boosted}
        onOpenFilters={() => setFilterOpen(true)}
        onBoost={() => setBoosted((b) => !b)}
      />

      <div className="relative flex-1">
        {matchState && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-2xl" style={{ background: 'rgba(0,0,0,0.75)' }}>
            <p className="text-4xl">🏠</p>
            <h2 className="text-2xl font-bold text-white">It&apos;s a match!</h2>
            <p className="text-base text-white/80">{matchState.candidateName}</p>
            <button type="button" onClick={() => setMatchState(null)} className="mt-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white">
              Начать общение
            </button>
          </div>
        )}

        {isEmpty ? (
          <EmptyState onReset={handleReset} />
        ) : (
          visible.map((profile, i) => (
            <SwipeCard
              key={profile.id}
              ref={(el) => {
                if (el) cardEls.current.set(profile.id, el);
                else cardEls.current.delete(profile.id);
              }}
              profile={profile}
              isTop={i === 0}
              stackIndex={i}
              exitDirection={i === 0 ? exitDirection : null}
              enterDirection={i === 1 ? enterDirection : null}
              onSwipe={handleSwipe}
              onCardTap={i === 0 ? () => setSelectedProfile(profiles.find(p => p.id === profile.id) ?? null) : undefined}
              getPeerEl={
                i === 0
                  ? () => {
                      const next = visible[1];
                      return next ? cardEls.current.get(next.id) ?? null : null;
                    }
                  : undefined
              }
            />
          ))
        )}

        {!isEmpty && (
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center">
            <ActionButtons
              onPass={() => handleAction('pass')}
              onLike={() => handleAction('like')}
              onSave={() => handleAction('save')}
              onSuperLike={() => handleAction('super_like')}
            />
          </div>
        )}

        <FilterSheet
          open={filterOpen}
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onClose={() => setFilterOpen(false)}
        />
      </div>

      <CandidateProfileSheet
        candidate={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onPass={() => { setSelectedProfile(null); handleAction('pass'); }}
        onLike={() => { setSelectedProfile(null); handleAction('like'); }}
        onSave={() => { setSelectedProfile(null); handleAction('save'); }}
        onSuperLike={() => { setSelectedProfile(null); handleAction('super_like'); }}
      />
    </div>
  );
}
