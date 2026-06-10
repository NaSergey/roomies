'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getVibeTags, type VibeTag } from '@/shared/lib/api';
import { haptic } from '@/shared/lib/telegram';
import { getWebApp } from '@/shared/lib/telegram';
import type { OnboardingState, ProfilePayload } from '../../model/types';

interface ProfileStepProps {
  state: OnboardingState;
  onSubmit: (payload: ProfilePayload) => void;
}

export function ProfileStep({ state, onSubmit }: ProfileStepProps) {
  const webApp = getWebApp();
  const telegramUser = webApp?.initDataUnsafe?.user;
  const telegramPhotoUrl = telegramUser?.photo_url ?? null;

  const [name, setName] = useState<string>(
    state.answers.name ||
      telegramUser?.first_name ||
      '',
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    state.answers.vibeTagIds ?? [],
  );
  const [tags, setTags] = useState<VibeTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [tagsError, setTagsError] = useState(false);

  function loadTags() {
    let cancelled = false;
    setLoadingTags(true);
    setTagsError(false);
    getVibeTags()
      .then((data) => {
        if (cancelled) return;
        setTags(data);
      })
      .catch(() => {
        if (cancelled) return;
        setTagsError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingTags(false);
      });
    return () => {
      cancelled = true;
    };
  }

  useEffect(() => {
    return loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTag(id: number) {
    haptic('light');
    setSelectedTagIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((t) => t !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  const canSubmit = name.trim().length >= 2 && selectedTagIds.length >= 1;
  const nameError =
    name.length > 0 && name.length < 2
      ? 'Имя должно быть не короче 2 символов'
      : null;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      photoUrls: [],
      vibeTagIds: selectedTagIds,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6">
      {/* Main step progress bar */}
      <div
        role="progressbar"
        aria-valuenow={5}
        aria-valuemax={6}
        aria-label="Прогресс онбординга"
        className="h-1 w-full rounded-full bg-surface-2 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${(5 / 6) * 100}%` }}
        />
      </div>

      <h1 className="text-2xl font-bold text-(--text)">Расскажи о себе</h1>

      {/* Photo */}
      <div className="mt-2">
        {telegramPhotoUrl ? (
          <div>
            <Image
              src={telegramPhotoUrl}
              width={120}
              height={120}
              alt="Фото из Telegram"
              unoptimized
              className="mx-auto rounded-full object-cover"
            />
            <p className="mt-2 text-center text-xs text-muted">
              Фото из Telegram
            </p>
          </div>
        ) : (
          <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-full bg-surface-2">
            <span className="text-4xl" aria-hidden="true">
              📷
            </span>
          </div>
        )}
      </div>

      {/* Name input */}
      <div>
        <input
          type="text"
          maxLength={32}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как тебя зовут?"
          className="mt-4 h-14 w-full rounded-2xl bg-surface px-4 text-base font-medium text-(--text) outline-none focus:ring-2 focus:ring-accent"
        />
        {nameError && (
          <p className="mt-1 text-sm text-rose-500" role="alert">
            {nameError}
          </p>
        )}
      </div>

      {/* Vibe tags */}
      <div className="mt-2">
        <p className="mb-3 text-sm font-medium text-(--text)">
          Твои теги{' '}
          <span className="text-muted">(выбери 3)</span>
        </p>

        {loadingTags ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 animate-pulse rounded-full bg-surface-2"
              />
            ))}
          </div>
        ) : tagsError ? (
          <p className="text-sm text-muted" role="alert">
            Не удалось загрузить теги.{' '}
            <button
              type="button"
              onClick={loadTags}
              className="underline text-(--text)"
            >
              Обновить?
            </button>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              const isDisabled =
                !isSelected && selectedTagIds.length >= 3;
              return (
                <button
                  key={tag.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  disabled={isDisabled}
                  onClick={() => toggleTag(tag.id)}
                  className={[
                    'flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium transition-opacity duration-150',
                    isSelected
                      ? 'bg-lavender text-(--text)'
                      : 'bg-surface text-(--text)',
                    isDisabled ? 'pointer-events-none opacity-40' : '',
                  ].join(' ')}
                  style={
                    isSelected ? undefined : { boxShadow: 'var(--shadow-button)' }
                  }
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-auto">
        <button
          type="button"
          disabled={!canSubmit || state.loading}
          onClick={handleSubmit}
          className="h-14 w-full rounded-2xl bg-accent text-base font-semibold text-(--text-on-accent) transition-transform active:scale-[0.97] disabled:opacity-50"
        >
          {state.loading ? (
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          ) : (
            'Готово'
          )}
        </button>
      </div>
    </div>
  );
}
