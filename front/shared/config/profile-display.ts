// Презентационные константы профиля, ранее продублированные по компонентам.

// Цвета наклеек вайб-тегов (циклически по индексу). Дублировались в
// ProfileCard, ProfileView и CandidateProfileSheet.
//
// Два представления одной палитры — потому что теги рисуются двумя способами:
// GLASS_TAG_TINTS — для <Glass> из @samasante/liquid-glass, который принимает
// заливку строкой в style; TAG_TINTS — те же тона утилитами Tailwind, для
// наклеек на обычных div. Тона чистые, «электрические», и берутся с низкой
// альфой (~0.2, см. --tint-* в globals.css): глубина у стекла идёт от
// насыщенности тона, а не от плотности заливки — выше этой альфы получается
// закрашенная пилюля, а не стекло. Палитра холодная — почему, см. --tint-* в
// globals.css.
export const GLASS_TAG_TINTS = [
  'var(--tint-violet)',
  'var(--tint-sky)',
  'var(--tint-pink)',
  'var(--tint-mint)',
  'var(--tint-cyan)',
] as const;

export const TAG_TINTS = [
  'bg-tint bg-tint-violet',
  'bg-tint bg-tint-sky',
  'bg-tint bg-tint-pink',
  'bg-tint bg-tint-mint',
  'bg-tint bg-tint-cyan',
] as const;

// Человекочитаемые подписи сценариев. Дублировались в ProfileView
// (SCENARIO_LABELS) и CandidateProfileSheet (BUDGET_SCENARIOS) один в один.
export const SCENARIO_LABELS: Record<string, string> = {
  looking_housing_roomie: 'Ищет жильё + соседа',
  has_housing_seeking_roomie: 'Сдаёт комнату',
  looking_roomie_only: 'Ищет соседа',
  flexible: 'Любой вариант',
};
