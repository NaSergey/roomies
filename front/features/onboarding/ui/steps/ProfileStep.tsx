'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ApiError, getVibeTags, mediaUrl, uploadPhoto, type VibeTag } from '@/shared/lib/api';
import { getWebApp, haptic } from '@/shared/lib/telegram';
import { Chip } from '@/shared/ui/Chip';
import { TextInput } from '@/shared/ui/TextInput';
import type { OnboardingState, ProfilePayload } from '../../model/types';
import { OnboardingLayout } from '../OnboardingLayout';

interface ProfileStepProps {
  state: OnboardingState;
  step: number;
  totalSteps: number;
  onSubmit: (payload: ProfilePayload) => void;
  onBack?: () => void;
}

export function ProfileStep({
  state,
  step,
  totalSteps,
  onSubmit,
  onBack,
}: ProfileStepProps) {
  const webApp = getWebApp();
  const telegramUser = webApp?.initDataUnsafe?.user;
  const telegramPhotoUrl = telegramUser?.photo_url ?? null;

  const [name, setName] = useState<string>(
    state.answers.name || telegramUser?.first_name || '',
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    state.answers.vibeTagIds ?? [],
  );
  const [tags, setTags] = useState<VibeTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [tagsError, setTagsError] = useState(false);

  // Фото: у Telegram-пользователей стартуем с их аватаркой, но её (как и заглушку
  // для браузерных аккаунтов) можно заменить своей — реальная загрузка на сервер.
  const [photoUrl, setPhotoUrl] = useState<string | null>(telegramPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadTags() {
    setLoadingTags(true);
    setTagsError(false);
    getVibeTags()
      .then(setTags)
      .catch(() => setTagsError(true))
      .finally(() => setLoadingTags(false));
  }

  useEffect(() => {
    loadTags();
  }, []);

  function toggleTag(id: number) {
    haptic('light');
    setSelectedTagIds((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // позволяет выбрать тот же файл повторно
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    uploadPhoto(file)
      .then(({ url }) => setPhotoUrl(url))
      .catch((err: unknown) => {
        setUploadError(
          err instanceof ApiError ? err.message : 'Не удалось загрузить фото',
        );
      })
      .finally(() => setUploading(false));
  }

  const canSubmit = name.trim().length >= 2 && selectedTagIds.length >= 1;

  return (
    <OnboardingLayout
      step={step}
      totalSteps={totalSteps}
      title="Расскажи о себе"
      subtitle="Имя, фото и три тега"
      onBack={onBack}
      onNext={() =>
        onSubmit({
          name: name.trim(),
          photoUrls: photoUrl ? [photoUrl] : [],
          vibeTagIds: selectedTagIds,
        })
      }
      canGoNext={canSubmit}
      loading={state.loading}
    >
      {/* Фото — тап открывает выбор файла и грузит его на сервер */}
      <div className="shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoPick}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label={photoUrl ? 'Заменить фото' : 'Загрузить фото'}
          className="relative mx-auto block h-28 w-28 disabled:opacity-70"
        >
          {photoUrl ? (
            <Image
              src={mediaUrl(photoUrl)}
              width={112}
              height={112}
              alt="Фото профиля"
              unoptimized
              className="h-28 w-28 rounded-full border-glass object-cover shadow-glass"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-glass bg-white/15 shadow-glass">
              <span className="text-4xl" aria-hidden="true">
                📷
              </span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <span
                className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-glass bg-accent-glass backdrop-glass shadow-glass">
            <span className="text-sm" aria-hidden="true">
              ✏️
            </span>
          </div>
        </button>
        {uploadError && (
          <p className="mt-2 text-center text-sm font-bold text-rose-500" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      <TextInput
        type="text"
        maxLength={32}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Как тебя зовут?"
        aria-label="Имя"
        className="h-14 w-full px-4 text-center text-base font-bold"
      />

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-(--text-deep) opacity-65">
          Твои теги (до 3)
        </span>

        {loadingTags ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-white/15" />
            ))}
          </div>
        ) : tagsError ? (
          <p className="text-sm text-(--text-deep) opacity-75" role="alert">
            Не удалось загрузить теги.{' '}
            <button type="button" onClick={loadTags} className="underline text-(--text-deep)">
              Обновить
            </button>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              const isDisabled = !isSelected && selectedTagIds.length >= 3;
              return (
                <Chip
                  key={tag.id}
                  active={isSelected}
                  onClick={() => toggleTag(tag.id)}
                  className={`flex min-h-11 items-center px-4${isDisabled ? ' pointer-events-none opacity-40' : ''}`}
                >
                  {tag.label}
                </Chip>
              );
            })}
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}
