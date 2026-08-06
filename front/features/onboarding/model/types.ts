// types.ts — type-only file, no 'use client' needed, no runtime imports

export type ScenarioType =
  | 'looking_housing_roomie'
  | 'has_housing_seeking_roomie'
  | 'looking_roomie_find_housing'
  | 'squad';

export type GuestsPreference = 'rarely' | 'sometimes' | 'often';

export type QuizAnswer = {
  questionId: number;
  optionCode: string;
  answerValue: number;
};

export type OnboardingAnswers = {
  scenario: ScenarioType | null;
  cityId: number | null;
  districtIds: number[];
  budgetMin: number | null;
  budgetMax: number | null;
  moveInDate: string | null;
  stayDurationMonths: number | null;
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: GuestsPreference;
  name: string;
  photoUrls: string[];
  vibeTagIds: number[];
};

export type OnboardingState = {
  step: number;
  loading: boolean;
  error: string | null;
  answers: OnboardingAnswers;
  onboardingCompleted: boolean;
};

export type OnboardingAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'UPDATE_ANSWERS'; answers: Partial<OnboardingAnswers> }
  | { type: 'COMPLETE' };

export type OnboardingStatus = {
  onboardingStep: number;
  onboardingCompleted: boolean;
  quizCompleted: boolean;
  scenario: ScenarioType | null;
  cityId: number | null;
  districtIds: number[];
  budgetMin: number | null;
  budgetMax: number | null;
  moveInDate: string | null;
  stayDurationMonths: number | null;
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: GuestsPreference;
  name: string;
  telegramPhotoUrl: string | null;
  vibeTagIds: number[];
};

// Payload types for API calls
export type LocationPayload = { cityId: number; districtIds?: number[] };
export type BudgetPayload = {
  budgetMin: number;
  budgetMax: number;
  moveInDate?: string;
  stayDurationMonths?: number;
};
export type DealbreakersPayload = {
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: GuestsPreference;
};
export type QuizPayload = { answers: QuizAnswer[] };
export type ProfilePayload = {
  name: string;
  photoUrls: string[];
  vibeTagIds: number[];
};
