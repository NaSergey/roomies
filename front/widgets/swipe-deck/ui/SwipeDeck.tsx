'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RoomieProfile } from '@/entities/profile';
import { ActionButtons, SwipeCard, useSwipeDeck } from '@/features/swipe-profile';
import type { SwipeDirection } from '@/features/swipe-profile';
import { getFeed, postSwipe } from '@/shared/lib/api';
import { EmptyState } from './EmptyState';

// Виджет: композиция фичи свайпа в полноценную колоду с кнопками и пустым состоянием.
// Самостоятельно загружает данные из GET /feed и отправляет POST /swipes на каждый свайп.
export function SwipeDeck() {
  const [profiles, setProfiles] = useState<RoomieProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchState, setMatchState] = useState<{
    candidateName: string;
    matchId: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFeed()
      .then((candidates) => {
        if (cancelled) return;
        setProfiles(candidates);
      })
      .catch(() => {
        if (!cancelled) setProfiles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { visible, exitDirection, isEmpty, swipe, reset } = useSwipeDeck(profiles);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      const currentProfile = visible[0];
      if (!currentProfile) return;

      const action = direction === 'right' ? 'like' : 'pass';
      swipe(direction); // triggers animation immediately (optimistic)

      try {
        const result = await postSwipe(currentProfile.id, action);
        if (result.matched && result.matchId != null) {
          setMatchState({
            candidateName: currentProfile.name,
            matchId: result.matchId,
          });
        }
      } catch (err) {
        console.error('[SwipeDeck] postSwipe failed:', err);
      }
    },
    [visible, swipe],
  );

  const handleReset = useCallback(async () => {
    try {
      const fresh = await getFeed();
      setProfiles(fresh);
      reset();
    } catch (err) {
      console.error('[SwipeDeck] handleReset failed:', err);
    }
  }, [reset]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-accent"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="relative flex-1">
        {matchState && (
          <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-2xl"
            style={{ background: 'rgba(0,0,0,0.75)' }}
          >
            <p className="text-4xl">🏠</p>
            <h2 className="text-2xl font-bold text-white">It&apos;s a match!</h2>
            <p className="text-base text-white/80">{matchState.candidateName}</p>
            <button
              type="button"
              onClick={() => setMatchState(null)}
              className="mt-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white"
            >
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
              profile={profile}
              isTop={i === 0}
              stackIndex={i}
              exitDirection={i === 0 ? exitDirection : null}
              onSwipe={handleSwipe}
            />
          ))
        )}
      </div>

      {!isEmpty && (
        <ActionButtons
          onPass={() => handleSwipe('left')}
          onLike={() => handleSwipe('right')}
        />
      )}
    </div>
  );
}
