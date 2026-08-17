'use client';

import { useState } from 'react';
import { useCitiesQuery, useDistrictsQuery } from '@/shared/lib/query';
import type { LocationPayload, StepChromeProps } from '../../model/types';
import { OnboardingLayout } from '../OnboardingLayout';
import { RadioRow } from '../RadioRow';

interface LocationStepProps extends StepChromeProps {
  onSubmit: (payload: LocationPayload) => void;
}

export function LocationStep({
  state,
  step,
  totalSteps,
  onSubmit,
  onBack,
  onDraft,
  direction,
}: LocationStepProps) {
  const [selectedCityId, setSelectedCityId] = useState<number | null>(
    state.answers.cityId,
  );
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<number[]>(
    state.answers.districtIds,
  );

  // Справочники через общий слой запросов (staleTime: Infinity), а не своим
  // fetch: шаг размонтируется на каждом «назад», и раньше города с районами
  // загружались заново при каждом возврате.
  const { data: cities = [], isError: citiesError, refetch } = useCitiesQuery();
  // Районы запрашиваются только когда город уже выбран.
  const { data: districts = [] } = useDistrictsQuery(selectedCityId ?? 0);

  function toggleDistrict(districtId: number) {
    setSelectedDistrictIds((prev) =>
      prev.includes(districtId)
        ? prev.filter((id) => id !== districtId)
        : [...prev, districtId],
    );
  }

  // Уходя назад, складываем выбранное в общее состояние — иначе выбор города
  // пропадал, стоило шагнуть назад и вернуться.
  const handleBack =
    onBack &&
    (() => {
      onDraft?.({
        cityId: selectedCityId,
        districtIds: selectedDistrictIds,
      });
      onBack();
    });

  return (
    <OnboardingLayout
      step={step}
      totalSteps={totalSteps}
      title="Где ищешь?"
      subtitle="Город обязательно, районы — по желанию"
      onBack={handleBack}
      direction={direction}
      onNext={() =>
        selectedCityId &&
        onSubmit({ cityId: selectedCityId, districtIds: selectedDistrictIds })
      }
      canGoNext={Boolean(selectedCityId)}
      loading={state.loading}
    >
      {/* Пока города едут — просто пусто: список короткий и приезжает быстро,
          а плейсхолдеры на его месте успевали моргнуть и дёрнуть раскладку. */}
      {citiesError ? (
        <p className="text-sm text-(--text-deep) opacity-75" role="alert">
          Не удалось загрузить города.{' '}
          <button
            type="button"
            onClick={() => refetch()}
            className="underline text-(--text-deep)"
          >
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
                // Районы принадлежат городу — при смене города сбрасываем выбор.
                // Сам список подменит useDistrictsQuery: у нового города свой
                // ключ кэша, поэтому районы предыдущего под ним не задержатся.
                setSelectedDistrictIds([]);
              }}
              label={city.name}
            />
          ))}
        </div>
      )}

      {selectedCityId && districts.length > 0 && (
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
