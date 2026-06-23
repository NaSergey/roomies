'use client';

import { useEffect, useState } from 'react';
import { getCities, getDistricts, type City, type District } from '@/shared/lib/api';
import { haptic } from '@/shared/lib/telegram';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
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
        <h1 className="text-2xl font-black text-(--text)">Где ищешь?</h1>
        <p className="mt-2 text-base text-muted">
          Город — обязательно, районы — по желанию
        </p>
      </div>

      <div className="relative">
        <select
          value={selectedCityId ?? ''}
          onChange={handleCityChange}
          disabled={loadingCities}
          className="h-14 w-full appearance-none rounded-xl border-2 border-black bg-white px-4 text-base font-bold text-(--text) outline-none disabled:opacity-50"
        >
          <option value="">
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
            className="text-muted"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {citiesError && (
        <p className="text-sm text-muted">
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
          <p className="mb-2 mt-4 text-sm font-bold text-muted">Районы</p>
          {loadingDistricts ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-9 w-24 animate-pulse rounded-full bg-[#f0efe9]"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {districts.map((district) => (
                <Chip
                  key={district.id}
                  active={selectedDistrictIds.includes(district.id)}
                  onClick={() => toggleDistrict(district.id)}
                  className="min-h-[44px] px-4 py-1.5"
                >
                  {district.name}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto">
        <Button
          loading={state.loading}
          disabled={!selectedCityId}
          onClick={() =>
            selectedCityId &&
            onSubmit({
              cityId: selectedCityId,
              districtIds: selectedDistrictIds,
            })
          }
          className="h-14 w-full text-base"
        >
          Продолжить
        </Button>
      </div>
    </div>
  );
}
