'use client';

import { useEffect, useState } from 'react';
import { getCities, getDistricts, type City, type District } from '@/shared/lib/api';
import { haptic } from '@/shared/lib/telegram';
import type { LocationPayload, OnboardingState } from '../../model/types';

interface LocationStepProps {
  state: OnboardingState;
  onSubmit: (payload: LocationPayload) => void;
}

export function LocationStep({ state, onSubmit }: LocationStepProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(
    state.answers.cityId,
  );
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<number[]>(
    state.answers.districtIds,
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingCities(true);
    getCities()
      .then((data) => {
        if (cancelled) return;
        setCities(data);
        setLoadingCities(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCitiesError('Не удалось загрузить список городов. Обновить?');
        setLoadingCities(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]);
      setSelectedDistrictIds([]);
      return;
    }
    let cancelled = false;
    setLoadingDistricts(true);
    getDistricts(selectedCityId)
      .then((data) => {
        if (cancelled) return;
        setDistricts(data);
        setLoadingDistricts(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDistricts([]);
        setLoadingDistricts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCityId]);

  function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedCityId(val ? Number(val) : null);
    setSelectedDistrictIds([]);
    haptic('light');
  }

  function toggleDistrict(districtId: number) {
    haptic('light');
    setSelectedDistrictIds((prev) =>
      prev.includes(districtId)
        ? prev.filter((id) => id !== districtId)
        : [...prev, districtId],
    );
  }

  function handleRetry() {
    setCitiesError(null);
    setLoadingCities(true);
    getCities()
      .then((data) => {
        setCities(data);
        setLoadingCities(false);
      })
      .catch(() => {
        setCitiesError('Не удалось загрузить список городов. Обновить?');
        setLoadingCities(false);
      });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text)">Где ищешь?</h1>
        <p className="mt-2 text-base text-(--text-muted)">
          Город — обязательно, районы — по желанию
        </p>
      </div>

      <div className="relative">
        <select
          value={selectedCityId ?? ''}
          onChange={handleCityChange}
          disabled={loadingCities}
          className="h-14 w-full appearance-none rounded-2xl bg-surface px-4 text-base text-(--text) disabled:opacity-50"
          style={{ boxShadow: 'var(--shadow-button)' }}
        >
          <option value="" className="text-(--text-muted)">
            {loadingCities ? 'Загрузка...' : 'Выбери город'}
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-(--text-muted)"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {citiesError && (
        <p className="text-sm text-(--text-muted)">
          {citiesError}{' '}
          <button
            type="button"
            onClick={handleRetry}
            className="underline text-(--text)"
          >
            Обновить
          </button>
        </p>
      )}

      {selectedCityId && districts.length > 0 && (
        <div>
          <p className="mb-2 mt-4 text-sm font-medium text-(--text-muted)">
            Районы
          </p>
          {loadingDistricts ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-9 w-24 animate-pulse rounded-full bg-surface-2"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {districts.map((district) => {
                const isSelected = selectedDistrictIds.includes(district.id);
                return (
                  <button
                    key={district.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => toggleDistrict(district.id)}
                    className={`min-h-[44px] rounded-full px-4 py-1.5 text-sm font-medium text-(--text) transition-colors ${isSelected ? 'bg-lavender' : 'bg-surface'}`}
                    style={{ boxShadow: 'var(--shadow-button)' }}
                  >
                    {district.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto">
        <button
          type="button"
          disabled={!selectedCityId || state.loading}
          onClick={() =>
            selectedCityId &&
            onSubmit({
              cityId: selectedCityId,
              districtIds: selectedDistrictIds,
            })
          }
          className="h-14 w-full rounded-2xl bg-accent text-base font-semibold text-(--text-on-accent) transition-transform active:scale-[0.97] disabled:opacity-50"
        >
          {state.loading ? (
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          ) : (
            'Продолжить'
          )}
        </button>
      </div>
    </div>
  );
}
