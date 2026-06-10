export type QuizQuestion = {
  id: number;
  text: string;
  optionA: { code: string; label: string; value: number };
  optionB: { code: string; label: string; value: number };
  scale:
    | 'noiseLevel'
    | 'cleanliness'
    | 'sleepSchedule'
    | 'socialLevel'
    | 'workFromHome';
  categoryIcon: string;
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: 'Тишина дома — важна?',
    optionA: { code: 'silence', label: '🔇 Обязательно', value: 1.0 },
    optionB: { code: 'noise', label: '🎵 Шум окей', value: 0.0 },
    scale: 'noiseLevel',
    categoryIcon: '🔇',
  },
  {
    id: 2,
    text: 'Как часто убираешься?',
    optionA: { code: 'clean_often', label: '🧹 Каждый день', value: 1.0 },
    optionB: { code: 'clean_sometimes', label: '😌 По настроению', value: 0.3 },
    scale: 'cleanliness',
    categoryIcon: '🧹',
  },
  {
    id: 3,
    text: 'Во сколько обычно ложишься?',
    optionA: { code: 'sleep_early', label: '🌙 До полуночи', value: 1.0 },
    optionB: { code: 'sleep_late', label: '🦉 После полуночи', value: 0.0 },
    scale: 'sleepSchedule',
    categoryIcon: '🛌',
  },
  {
    id: 4,
    text: 'Общаться дома охота?',
    optionA: { code: 'social_yes', label: '💬 Да, поболтать', value: 1.0 },
    optionB: { code: 'social_no', label: '🎧 Свои дела', value: 0.0 },
    scale: 'socialLevel',
    categoryIcon: '💬',
  },
  {
    id: 5,
    text: 'Работаешь из дома?',
    optionA: { code: 'wfh_yes', label: '💻 Да, часто', value: 1.0 },
    optionB: { code: 'wfh_no', label: '🏃 Нет, ухожу', value: 0.0 },
    scale: 'workFromHome',
    categoryIcon: '💻',
  },
  {
    id: 6,
    text: 'Звуки по вечерам — это норм?',
    optionA: { code: 'noise_evening_ok', label: '📺 Кино/музыка', value: 0.0 },
    optionB: { code: 'quiet_evening', label: '📖 Тишина вечером', value: 1.0 },
    scale: 'noiseLevel',
    categoryIcon: '🔇',
  },
  {
    id: 7,
    text: 'Общие зоны — кухня/ванна?',
    optionA: { code: 'clean_always', label: '✨ Всегда чисто', value: 1.0 },
    optionB: { code: 'clean_reasonable', label: '🆗 Чисто по мере', value: 0.5 },
    scale: 'cleanliness',
    categoryIcon: '🧹',
  },
  {
    id: 8,
    text: 'Утром — как ты?',
    optionA: { code: 'morning_person', label: '☀️ Бодрый сразу', value: 1.0 },
    optionB: { code: 'not_morning', label: '😴 Нужно время', value: 0.0 },
    scale: 'sleepSchedule',
    categoryIcon: '🛌',
  },
  {
    id: 9,
    text: 'Знакомиться с гостями соседа?',
    optionA: { code: 'guests_welcome', label: '😊 Всегда рад', value: 1.0 },
    optionB: { code: 'guests_privacy', label: '🚪 Своя жизнь', value: 0.0 },
    scale: 'socialLevel',
    categoryIcon: '💬',
  },
  {
    id: 10,
    text: 'Дом — место для...',
    optionA: { code: 'home_work', label: '🏠 Жить и работать', value: 1.0 },
    optionB: { code: 'home_sleep', label: '🌍 Только ночевать', value: 0.0 },
    scale: 'workFromHome',
    categoryIcon: '💻',
  },
];
