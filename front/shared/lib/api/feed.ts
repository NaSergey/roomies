'use client';

import { apiFetch } from './client';

export interface FeedQueryParams {
  budgetMin?: number;
  budgetMax?: number;
  districtIds?: number[];
  // Это НЕ «показать курящих», а «моя терпимость на этот заход»: false
  // ужесточает выдачу до некурящих, true снимает ограничение и пускает всех.
  // Бэк подставляет их вместо моих smokingOk/petsOk из профиля.
  smokingOk?: boolean;
  petsOk?: boolean;
  guestsPref?: 'rarely' | 'sometimes' | 'often';
}

export interface FeedCandidate {
  id: number;
  name: string;
  age?: number;
  scenario: string;
  budgetMin: number | null;
  budgetMax: number | null;
  photos: string[];
  vibeTags: { id: number; label: string }[];
  districts: { id: number; name: string }[];
  lifestyleScales: {
    noiseLevel: number | null;
    cleanliness: number | null;
    sleepSchedule: number | null;
    socialLevel: number | null;
    workFromHome: number | null;
  };
  matchScore: number;
  // smokingOk/petsOk — терпимость человека, smokes/hasPets — как он живёт.
  // Карточка показывает второе: «не курит» должно означать именно это.
  smokingOk: boolean;
  petsOk: boolean;
  smokes: boolean;
  hasPets: boolean;
  guestsPref: 'rarely' | 'sometimes' | 'often';
  matchReasons: string[];
  matchRisks?: string[];
}

export interface SwipeResult {
  matched: boolean;
  matchId?: number;
}

export function getFeed(params?: FeedQueryParams): Promise<FeedCandidate[]> {
  const qs = new URLSearchParams();
  if (params) {
    if (params.budgetMin !== undefined) qs.set('budgetMin', String(params.budgetMin));
    if (params.budgetMax !== undefined) qs.set('budgetMax', String(params.budgetMax));
    if (params.smokingOk !== undefined) qs.set('smokingOk', String(params.smokingOk));
    if (params.petsOk !== undefined) qs.set('petsOk', String(params.petsOk));
    if (params.guestsPref !== undefined) qs.set('guestsPref', params.guestsPref);
    // Повторяющийся ключ без скобок: districtIds=1&districtIds=2. Скобочную
    // нотацию (districtIds[]) разбирает только extended-парсер query, а бэк на
    // Express 5, где дефолт — simple: ключ приходил буквально как
    // "districtIds[]", в DTO не попадал, и фильтр по районам молча терялся.
    if (params.districtIds) {
      params.districtIds.forEach((id) => qs.append('districtIds', String(id)));
    }
  }
  const query = qs.toString();
  return apiFetch<FeedCandidate[]>(query ? `/feed?${query}` : '/feed', { method: 'GET' });
}

export function postSwipe(
  targetId: number,
  action: 'like' | 'pass' | 'super_like' | 'save',
): Promise<SwipeResult> {
  return apiFetch<SwipeResult>('/swipes', {
    method: 'POST',
    body: { targetId, action },
  });
}
