'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { ApiError } from '@/shared/lib/api';
import { getWebApp } from '@/shared/lib/telegram';
import {
  getOnboardingStatus,
  saveBudget,
  saveDealbreakers,
  saveLocation,
  saveProfile,
  saveQuiz,
  saveScenario,
} from '../api/onboarding-api';
import type {
  BudgetPayload,
  DealbreakersPayload,
  LocationPayload,
  OnboardingAction,
  OnboardingAnswers,
  OnboardingState,
  ProfilePayload,
  QuizPayload,
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
  guestsPref: 'sometimes',
  quizAnswers: [],
  name: '',
  photoUrls: [],
  vibeTagIds: [],
};

const initialState: OnboardingState = {
  step: 0,
  loading: false,
  error: null,
  answers: initialAnswers,
  onboardingCompleted: false,
};

function reducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'UPDATE_ANSWERS':
      return { ...state, answers: { ...state.answers, ...action.answers } };
    case 'COMPLETE':
      return { ...state, step: 6, onboardingCompleted: true };
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
  const [state, dispatch] = useReducer(reducer, initialState);

  // On mount: fetch status for resume
  useEffect(() => {
    let cancelled = false;
    getOnboardingStatus()
      .then((status) => {
        if (cancelled) return;
        if (status.onboardingCompleted) {
          dispatch({ type: 'COMPLETE' });
        } else if (status.onboardingStep > 0) {
          dispatch({ type: 'SET_STEP', step: status.onboardingStep });
          dispatch({
            type: 'UPDATE_ANSWERS',
            answers: {
              scenario: status.scenario,
              cityId: status.cityId,
              districtIds: status.districtIds,
              budgetMin: status.budgetMin,
              budgetMax: status.budgetMax,
              moveInDate: status.moveInDate,
              stayDurationMonths: status.stayDurationMonths,
              smokingOk: status.smokingOk,
              petsOk: status.petsOk,
              guestsPref: status.guestsPref,
              name: status.name,
              vibeTagIds: status.vibeTagIds,
            },
          });
        }
      })
      .catch(() => {
        /* ignore resume errors — start fresh */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // BackButton side effect
  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_STEP', step: state.step - 1 });
  }, [state.step]);

  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;
    if (state.step > 0 && state.step < 6) {
      wa.BackButton.show();
      wa.BackButton.onClick(handleBack);
    } else {
      wa.BackButton.hide();
    }
    return () => {
      wa.BackButton.offClick(handleBack);
    };
  }, [state.step, handleBack]);

  const submitScenario = useCallback(async (scenario: ScenarioType) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      await saveScenario(scenario);
      dispatch({ type: 'UPDATE_ANSWERS', answers: { scenario } });
      dispatch({ type: 'SET_STEP', step: 1 });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: extractError(e) });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const submitLocation = useCallback(async (payload: LocationPayload) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      await saveLocation(payload);
      dispatch({
        type: 'UPDATE_ANSWERS',
        answers: {
          cityId: payload.cityId,
          districtIds: payload.districtIds ?? [],
        },
      });
      dispatch({ type: 'SET_STEP', step: 2 });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: extractError(e) });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const submitBudget = useCallback(async (payload: BudgetPayload) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      await saveBudget(payload);
      dispatch({
        type: 'UPDATE_ANSWERS',
        answers: {
          budgetMin: payload.budgetMin,
          budgetMax: payload.budgetMax,
          moveInDate: payload.moveInDate ?? null,
          stayDurationMonths: payload.stayDurationMonths ?? null,
        },
      });
      dispatch({ type: 'SET_STEP', step: 3 });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: extractError(e) });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const submitDealbreakers = useCallback(
    async (payload: DealbreakersPayload) => {
      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'SET_ERROR', error: null });
      try {
        await saveDealbreakers(payload);
        dispatch({
          type: 'UPDATE_ANSWERS',
          answers: {
            smokingOk: payload.smokingOk,
            petsOk: payload.petsOk,
            guestsPref: payload.guestsPref,
          },
        });
        dispatch({ type: 'SET_STEP', step: 4 });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', error: extractError(e) });
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    [],
  );

  const submitQuiz = useCallback(async (payload: QuizPayload) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      await saveQuiz(payload);
      dispatch({
        type: 'UPDATE_ANSWERS',
        answers: { quizAnswers: payload.answers },
      });
      dispatch({ type: 'SET_STEP', step: 5 });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: extractError(e) });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const submitProfile = useCallback(async (payload: ProfilePayload) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      await saveProfile(payload);
      dispatch({
        type: 'UPDATE_ANSWERS',
        answers: {
          name: payload.name,
          photoUrls: payload.photoUrls,
          vibeTagIds: payload.vibeTagIds,
        },
      });
      dispatch({ type: 'SET_STEP', step: 6 });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: extractError(e) });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const onComplete = useCallback(() => {
    dispatch({ type: 'COMPLETE' });
  }, []);

  return {
    state,
    submitScenario,
    submitLocation,
    submitBudget,
    submitDealbreakers,
    submitQuiz,
    submitProfile,
    onComplete,
  };
}
