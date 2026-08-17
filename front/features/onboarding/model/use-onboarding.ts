'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/api';
import { getWebApp } from '@/shared/lib/telegram';
import {
  saveBudget,
  saveDealbreakers,
  saveLocation,
  saveProfile,
  saveScenario,
} from '../api/onboarding-api';
import { onboardingKeys } from './keys';
import type {
  BudgetPayload,
  DealbreakersPayload,
  LocationPayload,
  OnboardingAction,
  OnboardingAnswers,
  OnboardingState,
  OnboardingStatus,
  ProfilePayload,
  ScenarioType,
} from './types';

const initialAnswers: OnboardingAnswers = {
  scenario: null,
  cityId: null,
  districtIds: [],
  budgetMin: null,
  budgetMax: null,
  moveInDate: null,
  stayDurationMonths: null,
  smokingOk: false,
  petsOk: false,
  smokes: false,
  hasPets: false,
  guestsPref: 'sometimes',
  name: '',
  photoUrls: [],
  vibeTagIds: [],
};

// Стартовое состояние собираем из уже загруженного статуса: HomeView получает
// его через React Query и монтирует анкету только после успешного ответа,
// поэтому в кэше он всегда есть. Раньше анкета запрашивала статус ещё и сама,
// своим useEffect мимо React Query — отсюда три запроса /onboarding/status на
// старте и лишний перерендер всей анкеты после восстановления прогресса.
function createInitialState(status: OnboardingStatus | null): OnboardingState {
  // Анкету ещё не начинали — восстанавливать нечего. Ответы с сервера здесь
  // брать НЕЛЬЗЯ: scenario там уже заполнен дефолтом, который проставляется при
  // создании аккаунта, и первый вариант оказался бы выбранным за человека.
  if (!status || (!status.onboardingCompleted && status.onboardingStep === 0)) {
    return {
      step: 0,
      loading: false,
      error: null,
      answers: initialAnswers,
      onboardingCompleted: false,
    };
  }

  return {
    step: status.onboardingCompleted ? 5 : status.onboardingStep,
    loading: false,
    error: null,
    answers: {
      ...initialAnswers,
      scenario: status.scenario,
      cityId: status.cityId,
      districtIds: status.districtIds,
      budgetMin: status.budgetMin,
      budgetMax: status.budgetMax,
      moveInDate: status.moveInDate,
      stayDurationMonths: status.stayDurationMonths,
      smokingOk: status.smokingOk,
      petsOk: status.petsOk,
      smokes: status.smokes,
      hasPets: status.hasPets,
      guestsPref: status.guestsPref,
      name: status.name,
      vibeTagIds: status.vibeTagIds,
    },
    onboardingCompleted: status.onboardingCompleted,
  };
}

function reducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return state.step === action.step ? state : { ...state, step: action.step };
    case 'SET_ERROR':
      return state.error === action.error ? state : { ...state, error: action.error };
    case 'UPDATE_ANSWERS':
      return { ...state, answers: { ...state.answers, ...action.answers } };
    case 'SUBMIT_START':
      return state.loading && state.error === null
        ? state
        : { ...state, loading: true, error: null };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        answers: { ...state.answers, ...action.answers },
        step: action.step,
      };
    case 'SUBMIT_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'COMPLETE':
      return { ...state, step: 5, onboardingCompleted: true };
    default:
      return state;
  }
}

function extractError(e: unknown): string {
  return e instanceof ApiError
    ? e.message
    : e instanceof Error
      ? e.message
      : 'Что-то пошло не так';
}

export function useOnboarding() {
  const queryClient = useQueryClient();
  // Ленивая инициализация — статус читается из кэша один раз при монтировании,
  // без запроса и без последующего перерендера «догнавшими» данными.
  const [state, dispatch] = useReducer(reducer, null, () =>
    createInitialState(
      queryClient.getQueryData<OnboardingStatus>(onboardingKeys.status) ?? null,
    ),
  );

  // Переход на произвольный шаг — используется стрелкой «назад» в OnboardingLayout.
  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

  // Незаконченные ответы шага перед уходом назад — чтобы набранное не пропадало
  // при размонтировании шага (см. onDraft в StepChromeProps).
  const saveDraft = useCallback((answers: Partial<OnboardingAnswers>) => {
    dispatch({ type: 'UPDATE_ANSWERS', answers });
  }, []);

  // BackButton side effect
  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_STEP', step: state.step - 1 });
  }, [state.step]);

  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;
    if (state.step > 0 && state.step < 5) {
      wa.BackButton.show();
      wa.BackButton.onClick(handleBack);
    } else {
      wa.BackButton.hide();
    }
    return () => {
      wa.BackButton.offClick(handleBack);
    };
  }, [state.step, handleBack]);

  // Все пять шагов отправляются одинаково: показать индикатор, сохранить на
  // сервере, положить ответы и перейти дальше. Отличаются только запросом,
  // тем, что кладём в answers, и номером следующего шага.
  const submitStep = useCallback(
    async <P,>(
      save: (payload: P) => Promise<unknown>,
      payload: P,
      answers: Partial<OnboardingAnswers>,
      nextStep: number,
    ) => {
      dispatch({ type: 'SUBMIT_START' });
      try {
        await save(payload);
        dispatch({ type: 'SUBMIT_SUCCESS', answers, step: nextStep });
      } catch (e) {
        dispatch({ type: 'SUBMIT_ERROR', error: extractError(e) });
      }
    },
    [],
  );

  const submitScenario = useCallback(
    (scenario: ScenarioType) =>
      submitStep(saveScenario, scenario, { scenario }, 1),
    [submitStep],
  );

  const submitLocation = useCallback(
    (payload: LocationPayload) =>
      submitStep(
        saveLocation,
        payload,
        { cityId: payload.cityId, districtIds: payload.districtIds ?? [] },
        2,
      ),
    [submitStep],
  );

  const submitBudget = useCallback(
    (payload: BudgetPayload) =>
      submitStep(
        saveBudget,
        payload,
        {
          budgetMin: payload.budgetMin,
          budgetMax: payload.budgetMax,
          moveInDate: payload.moveInDate ?? null,
          stayDurationMonths: payload.stayDurationMonths ?? null,
        },
        3,
      ),
    [submitStep],
  );

  const submitDealbreakers = useCallback(
    (payload: DealbreakersPayload) =>
      submitStep(
        saveDealbreakers,
        payload,
        {
          smokingOk: payload.smokingOk,
          petsOk: payload.petsOk,
          smokes: payload.smokes,
          hasPets: payload.hasPets,
          guestsPref: payload.guestsPref,
        },
        4,
      ),
    [submitStep],
  );

  const submitProfile = useCallback(
    (payload: ProfilePayload) =>
      submitStep(
        saveProfile,
        payload,
        {
          name: payload.name,
          photoUrls: payload.photoUrls,
          vibeTagIds: payload.vibeTagIds,
        },
        5,
      ),
    [submitStep],
  );

  // Тост с ошибкой гасится сам: он относится к конкретной прошлой попытке и не
  // должен висеть поверх следующих вопросов, пока пользователь не отправит шаг.
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const onComplete = useCallback(() => {
    dispatch({ type: 'COMPLETE' });
  }, []);

  return {
    state,
    goToStep,
    saveDraft,
    clearError,
    submitScenario,
    submitLocation,
    submitBudget,
    submitDealbreakers,
    submitProfile,
    onComplete,
  };
}
