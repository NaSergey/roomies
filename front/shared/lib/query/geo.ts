'use client';

import { useQuery } from '@tanstack/react-query';
import { getCities, getDistricts, type City, type District } from '@/shared/lib/api';

export const geoKeys = {
  cities: ['geo', 'cities'] as const,
  districts: (cityId: number) => ['geo', 'districts', cityId] as const,
};

/** Справочник городов. Тот же staleTime: Infinity, что и у районов: список
 *  фиксирован, а шаг «Где ищешь?» при каждом возврате назад монтируется заново
 *  и раньше тянул города своим fetch — за одну анкету выходило четыре запроса. */
export function useCitiesQuery() {
  return useQuery({
    queryKey: geoKeys.cities,
    queryFn: getCities,
    staleTime: Infinity,
  });
}

/** Лента пока живёт в одном городе — район выбирается из его справочника.
 *  Здесь, а не в виджете ленты: константу читают и шторка фильтров, и прогрев
 *  в MainShell, а импортировать её виджету у виджета через слой было бы хуже. */
export const DEFAULT_CITY_ID = 1;

/** Справочник районов города.
 *
 *  staleTime: Infinity — список районов не меняется в течение сессии, поэтому
 *  запрос уходит ровно один раз, а все последующие потребители читают кэш.
 *  Именно это и лечит «подпрыгивание» шторки фильтров: раньше FilterSheet
 *  тянул районы своим useEffect по факту открытия (fetch руками, мимо общего
 *  слоя запросов), блок «Районы» до ответа не рендерился вовсе — панель прибита
 *  к bottom-0 и растёт вверх, поэтому пришедшие чипы выталкивали её рывком уже
 *  после того, как она выехала. Теперь запрос не привязан к open и греется
 *  заранее (см. prefetch в MainShell), так что к открытию данные на месте. */
export function useDistrictsQuery(cityId: number) {
  return useQuery({
    queryKey: geoKeys.districts(cityId),
    queryFn: () => getDistricts(cityId),
    staleTime: Infinity,
    // Город может быть ещё не выбран (шаг «Где ищешь?» открывается пустым) —
    // тогда запрашивать нечего.
    enabled: cityId > 0,
  });
}

export type { City, District };
