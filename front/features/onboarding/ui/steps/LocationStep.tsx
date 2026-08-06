'use client';

import { useEffect, useState } from 'react';
import { getCities, getDistricts, type City, type District } from '@/shared/lib/api';
import type { LocationPayload, OnboardingState } from '../../model/types';
import { OnboardingLayout } from '../OnboardingLayout';
import { RadioRow } from '../RadioRow';

interface LocationStepProps {
  state: OnboardingState;
  step: number;
  totalSteps: number;
  onSubmit: (payload: LocationPayload) => void;
  onBack?: () => void;
}

export function LocationStep({
  state,
  step,
  totalSteps,
  onSubmit,
  onBack,
}: LocationStepProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [citiesError, setCitiesError] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(
    state.answers.cityId,
  );
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<number[]>(
    state.answers.districtIds,
  );

  function loadCities() {
    setLoadingCities(true);
    setCitiesError(false);
    getCities()
      .then(setCities)
      .catch(() => setCitiesError(true))
      .finally(() => setLoadingCities(false));
  }

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setLoadingDistricts(true);
    getDistricts(selectedCityId)
      .then((data) => {
        if (!cancelled) setDistricts(data);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCityId]);

  function toggleDistrict(districtId: number) {
    setSelectedDistrictIds((prev) =>
      prev.includes(districtId)
        ? prev.filter((id) => id !== districtId)
        : [...prev, districtId],
    );
  }

  return (
    <OnboardingLayout
      step={step}
      totalSteps={totalSteps}
      title="Где ищешь?"
      subtitle="Город обязательно, районы — по желанию"
      onBack={onBack}
      onNext={() =>
        selectedCityId &&
        onSubmit({ cityId: selectedCityId, districtIds: selectedDistrictIds })
      }
      canGoNext={Boolean(selectedCityId)}
      loading={state.loading}
    >
      {loadingCities ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-white/15" />
          ))}
        </div>
      ) : citiesError ? (
        <p className="text-sm text-(--text-deep) opacity-75" role="alert">
          Не удалось загрузить города.{' '}
          <button type="button" onClick={loadCities} className="underline text-(--text-deep)">
            Обновить
          </button>
        </p>
      ) : (
        <div role="radiogroup" aria-label="Город" className="flex flex-col gap-1">
          {cities.map((city) => (
            <RadioRow
              key={city.id}
              selected={selectedCityId === city.id}
              onSelect={() => {
                setSelectedCityId(city.id);
                // Районы принадлежат городу — при смене города сбрасываем.
                setSelectedDistrictIds([]);
              }}
              label={city.name}
            />
          ))}
        </div>
      )}

      {selectedCityId && !loadingDistricts && districts.length > 0 && (
        <div role="group" aria-label="Районы" className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-(--text-deep) opacity-65">
            Районы
          </span>
          {districts.map((district) => (
            <RadioRow
              key={district.id}
              multiple
              selected={selectedDistrictIds.includes(district.id)}
              onSelect={() => toggleDistrict(district.id)}
              label={district.name}
            />
          ))}
        </div>
      )}
    </OnboardingLayout>
  );
}
