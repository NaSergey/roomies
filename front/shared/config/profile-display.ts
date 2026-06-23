// Презентационные константы профиля, ранее продублированные по компонентам.

// Цвета наклеек вайб-тегов (циклически по индексу). Был скопирован в
// ProfileCard, ProfileView и CandidateProfileSheet.
export const TAG_COLORS = ['bg-[#c8f36a]', 'bg-[#a8d8ff]', 'bg-[#ffb8d4]'] as const;

// Человекочитаемые подписи сценариев. Дублировались в ProfileView
// (SCENARIO_LABELS) и CandidateProfileSheet (BUDGET_SCENARIOS) один в один.
export const SCENARIO_LABELS: Record<string, string> = {
  looking_housing_roomie: 'Ищет жильё + соседа',
  has_housing_seeking_roomie: 'Сдаёт комнату',
  looking_roomie_only: 'Ищет соседа',
  flexible: 'Любой вариант',
};
