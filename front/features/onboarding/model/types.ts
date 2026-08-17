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
  smokes: boolean;
  hasPets: boolean;
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

/** Направление движения по анкете — задаёт сторону, с которой выезжает вопрос. */
export type StepDirection = 'forward' | 'back';

/**
 * Общая часть пропсов всех шагов анкеты: то, что шаг не решает сам, а получает
 * от OnboardingFlow и передаёт в OnboardingLayout. Раньше каждый шаг объявлял
 * этот набор заново, и любое новое поле приходилось дописывать в пять мест.
 */
export type StepChromeProps = {
  state: OnboardingState;
  /** Номер шага с 1 — для счётчика в шапке. */
  step: number;
  totalSteps: number;
  onBack?: () => void;
  direction?: StepDirection;
  /**
   * Сложить незаконченные ответы шага в общее состояние перед уходом назад.
   * Шаги живут в локальном состоянии и при смене шага размонтируются, поэтому
   * без этого набранное («31 338» в бюджете) исчезало, стоило шагнуть назад
   * и вернуться: в answers оно попадало только после успешной отправки.
   */
  onDraft?: (answers: Partial<OnboardingAnswers>) => void;
};

export type OnboardingAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'UPDATE_ANSWERS'; answers: Partial<OnboardingAnswers> }
  // Отправка шага — тремя действиями вместо пяти отдельных. Раньше один submit
  // делал SET_LOADING → SET_ERROR → UPDATE_ANSWERS → SET_STEP → SET_LOADING,
  // и каждый переход стоил лишних рендеров всей анкеты.
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; answers: Partial<OnboardingAnswers>; step: number }
  | { type: 'SUBMIT_ERROR'; error: string }
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
  smokes: boolean;
  hasPets: boolean;
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
  smokes: boolean;
  hasPets: boolean;
  guestsPref: GuestsPreference;
};
export type QuizPayload = { answers: QuizAnswer[] };
export type ProfilePayload = {
  name: string;
  photoUrls: string[];
  vibeTagIds: number[];
};
