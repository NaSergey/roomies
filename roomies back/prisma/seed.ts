import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

// ---- Данные для сидинга ----

const CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Казань',
  'Новосибирск',
  'Екатеринбург',
  'Краснодар',
  'Нижний Новгород',
] as const;

const DISTRICTS_BY_CITY: Record<string, string[]> = {
  'Москва': ['Центр', 'Замоскворечье', 'Арбат', 'Хамовники', 'Сокольники'],
  'Санкт-Петербург': ['Центральный', 'Петроградский', 'Василеостровский', 'Московский', 'Невский'],
  'Казань': ['Вахитовский', 'Советский', 'Авиастроительный', 'Приволжский'],
  'Новосибирск': ['Центральный', 'Заельцовский', 'Советский', 'Октябрьский'],
  'Екатеринбург': ['Центральный', 'Верх-Исетский', 'Железнодорожный', 'Орджоникидзевский'],
  'Краснодар': ['Центральный', 'Прикубанский', 'Карасунский'],
  'Нижний Новгород': ['Нижегородский', 'Советский', 'Автозаводский'],
};

const QUIZ_QUESTIONS = [
  {
    id: 1,
    category: 'noiseLevel',
    questionText: 'Тишина дома — важна?',
    options: [
      { code: 'silence', label: '🔇 Обязательно', value: 1.0 },
      { code: 'noise', label: '🎵 Шум окей', value: 0.0 },
    ],
    displayOrder: 1,
  },
  {
    id: 2,
    category: 'cleanliness',
    questionText: 'Как часто убираешься?',
    options: [
      { code: 'clean_often', label: '🧹 Каждый день', value: 1.0 },
      { code: 'clean_sometimes', label: '😌 По настроению', value: 0.3 },
    ],
    displayOrder: 2,
  },
  {
    id: 3,
    category: 'sleepSchedule',
    questionText: 'Во сколько обычно ложишься?',
    options: [
      { code: 'sleep_early', label: '🌙 До полуночи', value: 1.0 },
      { code: 'sleep_late', label: '🦉 После полуночи', value: 0.0 },
    ],
    displayOrder: 3,
  },
  {
    id: 4,
    category: 'socialLevel',
    questionText: 'Общаться дома охота?',
    options: [
      { code: 'social_yes', label: '💬 Да, поболтать', value: 1.0 },
      { code: 'social_no', label: '🎧 Свои дела', value: 0.0 },
    ],
    displayOrder: 4,
  },
  {
    id: 5,
    category: 'workFromHome',
    questionText: 'Работаешь из дома?',
    options: [
      { code: 'wfh_yes', label: '💻 Да, часто', value: 1.0 },
      { code: 'wfh_no', label: '🏃 Нет, ухожу', value: 0.0 },
    ],
    displayOrder: 5,
  },
  {
    id: 6,
    category: 'noiseLevel',
    questionText: 'Звуки по вечерам — это норм?',
    options: [
      { code: 'noise_evening_ok', label: '📺 Кино/музыка', value: 0.0 },
      { code: 'quiet_evening', label: '📖 Тишина вечером', value: 1.0 },
    ],
    displayOrder: 6,
  },
  {
    id: 7,
    category: 'cleanliness',
    questionText: 'Общие зоны — кухня/ванна?',
    options: [
      { code: 'clean_always', label: '✨ Всегда чисто', value: 1.0 },
      { code: 'clean_reasonable', label: '🆗 Чисто по мере', value: 0.5 },
    ],
    displayOrder: 7,
  },
  {
    id: 8,
    category: 'sleepSchedule',
    questionText: 'Утром — как ты?',
    options: [
      { code: 'morning_person', label: '☀️ Бодрый сразу', value: 1.0 },
      { code: 'not_morning', label: '😴 Нужно время', value: 0.0 },
    ],
    displayOrder: 8,
  },
  {
    id: 9,
    category: 'socialLevel',
    questionText: 'Знакомиться с гостями соседа?',
    options: [
      { code: 'guests_welcome', label: '😊 Всегда рад', value: 1.0 },
      { code: 'guests_privacy', label: '🚪 Своя жизнь', value: 0.0 },
    ],
    displayOrder: 9,
  },
  {
    id: 10,
    category: 'workFromHome',
    questionText: 'Дом — место для...',
    options: [
      { code: 'home_work', label: '🏠 Жить и работать', value: 1.0 },
      { code: 'home_sleep', label: '🌍 Только ночевать', value: 0.0 },
    ],
    displayOrder: 10,
  },
] as const;

const VIBE_TAGS = [
  'Ранняя пташка',
  'Сова',
  'Люблю готовить',
  'Спорт каждый день',
  'Работаю из дома',
  'Домосед',
  'Общительный',
  'Интроверт',
  'Веган',
  'Кошатник',
  'Собачник',
  'Читаю',
  'Сериалы',
  'Музыка громкая',
  'Тишина обязательна',
  'Чай/кофе утром',
  'Йога и медитация',
  'Путешествия',
  'Творчество',
  'Гики и технологии',
  'Велосипед/ролики',
  'Ночная жизнь',
] as const;

// ---- Фейковые профили для матчинга ----

type ScenarioType = 'looking_housing_roomie' | 'has_housing_seeking_roomie' | 'looking_roomie_find_housing' | 'squad';

interface FakeUser {
  telegramId: bigint;
  name: string;
  scenario: ScenarioType;
  budgetMin: number;
  budgetMax: number;
  smokingOk: boolean;
  petsOk: boolean;
  noiseLevel: number;
  cleanliness: number;
  sleepSchedule: number;
  socialLevel: number;
  workFromHome: number;
  districtIdxs: [number, number];
  tagIdxs: [number, number, number];
  quizAnswers: { questionId: number; optionCode: string; answerValue: number }[];
}

const FAKE_USERS: FakeUser[] = [
  // 1 — looking_housing_roomie, тихий интроверт, чистюля
  {
    telegramId: 1100000001n,
    name: 'Алексей Смирнов',
    scenario: 'looking_housing_roomie',
    budgetMin: 30000, budgetMax: 50000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.90, cleanliness: 0.95, sleepSchedule: 0.85, socialLevel: 0.10, workFromHome: 0.80,
    districtIdxs: [0, 1], tagIdxs: [0, 6, 14],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 2 — has_housing_seeking_roomie, общительная сова
  {
    telegramId: 1100000002n,
    name: 'Мария Козлова',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 25000, budgetMax: 45000,
    smokingOk: false, petsOk: true,
    noiseLevel: 0.20, cleanliness: 0.60, sleepSchedule: 0.10, socialLevel: 0.90, workFromHome: 0.30,
    districtIdxs: [1, 2], tagIdxs: [1, 6, 10],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_sometimes', answerValue: 0.3 },
      { questionId: 3, optionCode: 'sleep_late', answerValue: 0.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'noise_evening_ok', answerValue: 0.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'not_morning', answerValue: 0.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 3 — looking_housing_roomie, умеренный
  {
    telegramId: 1100000003n,
    name: 'Дмитрий Попов',
    scenario: 'looking_housing_roomie',
    budgetMin: 20000, budgetMax: 38000,
    smokingOk: true, petsOk: false,
    noiseLevel: 0.50, cleanliness: 0.70, sleepSchedule: 0.60, socialLevel: 0.50, workFromHome: 0.50,
    districtIdxs: [0, 3], tagIdxs: [4, 11, 12],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 4 — has_housing_seeking_roomie, ранняя пташка-чистюля
  {
    telegramId: 1100000004n,
    name: 'Анна Петрова',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 35000, budgetMax: 55000,
    smokingOk: false, petsOk: true,
    noiseLevel: 0.85, cleanliness: 0.90, sleepSchedule: 0.95, socialLevel: 0.40, workFromHome: 0.70,
    districtIdxs: [2, 4], tagIdxs: [0, 2, 15],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 5 — looking_housing_roomie, любит готовить, спорт
  {
    telegramId: 1100000005n,
    name: 'Сергей Иванов',
    scenario: 'looking_housing_roomie',
    budgetMin: 25000, budgetMax: 40000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.40, cleanliness: 0.75, sleepSchedule: 0.80, socialLevel: 0.65, workFromHome: 0.20,
    districtIdxs: [1, 3], tagIdxs: [2, 3, 17],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'noise_evening_ok', answerValue: 0.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 6 — has_housing_seeking_roomie, тихая WFH интроверт
  {
    telegramId: 1100000006n,
    name: 'Екатерина Сидорова',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 30000, budgetMax: 50000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.95, cleanliness: 0.85, sleepSchedule: 0.75, socialLevel: 0.15, workFromHome: 0.90,
    districtIdxs: [0, 2], tagIdxs: [4, 7, 14],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 7 — looking_housing_roomie, ночная жизнь, шумный
  {
    telegramId: 1100000007n,
    name: 'Никита Волков',
    scenario: 'looking_housing_roomie',
    budgetMin: 20000, budgetMax: 35000,
    smokingOk: true, petsOk: true,
    noiseLevel: 0.05, cleanliness: 0.35, sleepSchedule: 0.00, socialLevel: 0.95, workFromHome: 0.10,
    districtIdxs: [3, 4], tagIdxs: [1, 6, 21],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_sometimes', answerValue: 0.3 },
      { questionId: 3, optionCode: 'sleep_late', answerValue: 0.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'noise_evening_ok', answerValue: 0.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'not_morning', answerValue: 0.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 8 — has_housing_seeking_roomie, читает, йога
  {
    telegramId: 1100000008n,
    name: 'Ольга Новикова',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 40000, budgetMax: 60000,
    smokingOk: false, petsOk: true,
    noiseLevel: 0.80, cleanliness: 0.88, sleepSchedule: 0.90, socialLevel: 0.30, workFromHome: 0.60,
    districtIdxs: [0, 4], tagIdxs: [11, 16, 7],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 9 — looking_housing_roomie, велосипед, умеренный
  {
    telegramId: 1100000009n,
    name: 'Павел Морозов',
    scenario: 'looking_housing_roomie',
    budgetMin: 25000, budgetMax: 42000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.55, cleanliness: 0.65, sleepSchedule: 0.70, socialLevel: 0.55, workFromHome: 0.45,
    districtIdxs: [2, 3], tagIdxs: [3, 20, 17],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 10 — has_housing_seeking_roomie, гик, WFH
  {
    telegramId: 1100000010n,
    name: 'Татьяна Алексеева',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 30000, budgetMax: 48000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.70, cleanliness: 0.80, sleepSchedule: 0.50, socialLevel: 0.35, workFromHome: 0.85,
    districtIdxs: [1, 4], tagIdxs: [4, 7, 19],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_late', answerValue: 0.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'not_morning', answerValue: 0.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 11 — looking_housing_roomie, творчество, сова
  {
    telegramId: 1100000011n,
    name: 'Игорь Лебедев',
    scenario: 'looking_housing_roomie',
    budgetMin: 20000, budgetMax: 36000,
    smokingOk: true, petsOk: false,
    noiseLevel: 0.25, cleanliness: 0.45, sleepSchedule: 0.05, socialLevel: 0.75, workFromHome: 0.55,
    districtIdxs: [3, 1], tagIdxs: [1, 18, 12],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_sometimes', answerValue: 0.3 },
      { questionId: 3, optionCode: 'sleep_late', answerValue: 0.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'noise_evening_ok', answerValue: 0.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'not_morning', answerValue: 0.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 12 — has_housing_seeking_roomie, веган, тихая
  {
    telegramId: 1100000012n,
    name: 'Наталья Козлова',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 35000, budgetMax: 55000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.78, cleanliness: 0.92, sleepSchedule: 0.88, socialLevel: 0.20, workFromHome: 0.75,
    districtIdxs: [0, 3], tagIdxs: [8, 16, 14],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 13 — looking_housing_roomie, кошатник, умеренный
  {
    telegramId: 1100000013n,
    name: 'Артём Соколов',
    scenario: 'looking_housing_roomie',
    budgetMin: 25000, budgetMax: 45000,
    smokingOk: false, petsOk: true,
    noiseLevel: 0.60, cleanliness: 0.72, sleepSchedule: 0.65, socialLevel: 0.58, workFromHome: 0.40,
    districtIdxs: [2, 1], tagIdxs: [9, 15, 5],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 14 — has_housing_seeking_roomie, музыка громкая, ночной
  {
    telegramId: 1100000014n,
    name: 'Виктор Попов',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 20000, budgetMax: 38000,
    smokingOk: true, petsOk: true,
    noiseLevel: 0.10, cleanliness: 0.30, sleepSchedule: 0.05, socialLevel: 0.88, workFromHome: 0.15,
    districtIdxs: [4, 2], tagIdxs: [13, 21, 6],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_sometimes', answerValue: 0.3 },
      { questionId: 3, optionCode: 'sleep_late', answerValue: 0.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'noise_evening_ok', answerValue: 0.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'not_morning', answerValue: 0.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 15 — looking_housing_roomie, путешественница
  {
    telegramId: 1100000015n,
    name: 'Юлия Фёдорова',
    scenario: 'looking_housing_roomie',
    budgetMin: 30000, budgetMax: 50000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.45, cleanliness: 0.78, sleepSchedule: 0.55, socialLevel: 0.70, workFromHome: 0.35,
    districtIdxs: [0, 4], tagIdxs: [17, 3, 6],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_late', answerValue: 0.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'noise_evening_ok', answerValue: 0.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'not_morning', answerValue: 0.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 16 — has_housing_seeking_roomie, сериалы, ранний
  {
    telegramId: 1100000016n,
    name: 'Максим Орлов',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 25000, budgetMax: 43000,
    smokingOk: false, petsOk: true,
    noiseLevel: 0.35, cleanliness: 0.68, sleepSchedule: 0.80, socialLevel: 0.45, workFromHome: 0.50,
    districtIdxs: [1, 0], tagIdxs: [12, 5, 15],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'noise_evening_ok', answerValue: 0.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 17 — looking_housing_roomie, спортсмен, рано встаёт
  {
    telegramId: 1100000017n,
    name: 'Роман Семёнов',
    scenario: 'looking_housing_roomie',
    budgetMin: 25000, budgetMax: 40000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.65, cleanliness: 0.82, sleepSchedule: 0.92, socialLevel: 0.60, workFromHome: 0.25,
    districtIdxs: [3, 2], tagIdxs: [3, 0, 20],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 18 — has_housing_seeking_roomie, умеренная, собачница
  {
    telegramId: 1100000018n,
    name: 'Ксения Громова',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 30000, budgetMax: 52000,
    smokingOk: false, petsOk: true,
    noiseLevel: 0.55, cleanliness: 0.73, sleepSchedule: 0.68, socialLevel: 0.62, workFromHome: 0.48,
    districtIdxs: [2, 0], tagIdxs: [10, 2, 16],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 19 — looking_housing_roomie, домосед, читает
  {
    telegramId: 1100000019n,
    name: 'Андрей Белов',
    scenario: 'looking_housing_roomie',
    budgetMin: 35000, budgetMax: 58000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.88, cleanliness: 0.96, sleepSchedule: 0.72, socialLevel: 0.12, workFromHome: 0.78,
    districtIdxs: [4, 3], tagIdxs: [5, 11, 4],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 20 — has_housing_seeking_roomie, творческая, сова
  {
    telegramId: 1100000020n,
    name: 'Светлана Якова',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 25000, budgetMax: 44000,
    smokingOk: true, petsOk: false,
    noiseLevel: 0.30, cleanliness: 0.55, sleepSchedule: 0.20, socialLevel: 0.80, workFromHome: 0.60,
    districtIdxs: [1, 3], tagIdxs: [18, 1, 12],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_sometimes', answerValue: 0.3 },
      { questionId: 3, optionCode: 'sleep_late', answerValue: 0.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'noise_evening_ok', answerValue: 0.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'not_morning', answerValue: 0.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 21 — looking_housing_roomie, тихая, WFH, чистюля
  {
    telegramId: 1100000021n,
    name: 'Дарья Крылова',
    scenario: 'looking_housing_roomie',
    budgetMin: 30000, budgetMax: 50000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.92, cleanliness: 0.89, sleepSchedule: 0.82, socialLevel: 0.18, workFromHome: 0.88,
    districtIdxs: [0, 2], tagIdxs: [4, 14, 7],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 22 — looking_housing_roomie, общительный, кухня
  {
    telegramId: 1100000022n,
    name: 'Евгений Захаров',
    scenario: 'looking_housing_roomie',
    budgetMin: 20000, budgetMax: 37000,
    smokingOk: false, petsOk: true,
    noiseLevel: 0.40, cleanliness: 0.70, sleepSchedule: 0.62, socialLevel: 0.85, workFromHome: 0.30,
    districtIdxs: [3, 0], tagIdxs: [2, 6, 15],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'noise_evening_ok', answerValue: 0.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 23 — has_housing_seeking_roomie, ранняя пташка, кошатница
  {
    telegramId: 1100000023n,
    name: 'Ирина Тарасова',
    scenario: 'has_housing_seeking_roomie',
    budgetMin: 35000, budgetMax: 56000,
    smokingOk: false, petsOk: true,
    noiseLevel: 0.75, cleanliness: 0.84, sleepSchedule: 0.94, socialLevel: 0.42, workFromHome: 0.66,
    districtIdxs: [4, 1], tagIdxs: [0, 9, 16],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
  // 24 — looking_roomie_find_housing (valid but won't appear in standard feed)
  {
    telegramId: 1100000024n,
    name: 'Михаил Козлов',
    scenario: 'looking_roomie_find_housing',
    budgetMin: 25000, budgetMax: 45000,
    smokingOk: false, petsOk: false,
    noiseLevel: 0.62, cleanliness: 0.76, sleepSchedule: 0.58, socialLevel: 0.52, workFromHome: 0.44,
    districtIdxs: [2, 4], tagIdxs: [5, 11, 19],
    quizAnswers: [
      { questionId: 1, optionCode: 'noise', answerValue: 0.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_late', answerValue: 0.0 },
      { questionId: 4, optionCode: 'social_yes', answerValue: 1.0 },
      { questionId: 5, optionCode: 'wfh_no', answerValue: 0.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_reasonable', answerValue: 0.5 },
      { questionId: 8, optionCode: 'not_morning', answerValue: 0.0 },
      { questionId: 9, optionCode: 'guests_welcome', answerValue: 1.0 },
      { questionId: 10, optionCode: 'home_sleep', answerValue: 0.0 },
    ],
  },
  // 25 — looking_roomie_find_housing (valid but won't appear in standard feed)
  {
    telegramId: 1100000025n,
    name: 'Валерия Климова',
    scenario: 'looking_roomie_find_housing',
    budgetMin: 30000, budgetMax: 50000,
    smokingOk: false, petsOk: true,
    noiseLevel: 0.68, cleanliness: 0.80, sleepSchedule: 0.75, socialLevel: 0.48, workFromHome: 0.72,
    districtIdxs: [1, 3], tagIdxs: [16, 2, 7],
    quizAnswers: [
      { questionId: 1, optionCode: 'silence', answerValue: 1.0 },
      { questionId: 2, optionCode: 'clean_often', answerValue: 1.0 },
      { questionId: 3, optionCode: 'sleep_early', answerValue: 1.0 },
      { questionId: 4, optionCode: 'social_no', answerValue: 0.0 },
      { questionId: 5, optionCode: 'wfh_yes', answerValue: 1.0 },
      { questionId: 6, optionCode: 'quiet_evening', answerValue: 1.0 },
      { questionId: 7, optionCode: 'clean_always', answerValue: 1.0 },
      { questionId: 8, optionCode: 'morning_person', answerValue: 1.0 },
      { questionId: 9, optionCode: 'guests_privacy', answerValue: 0.0 },
      { questionId: 10, optionCode: 'home_work', answerValue: 1.0 },
    ],
  },
];

async function seedFakeProfiles(): Promise<void> {
  console.log('Добавляем фейковые профили для матчинга...');

  // Fetch reference data
  const moscowCity = await prisma.city.findFirst({ where: { name: 'Москва' } });
  if (!moscowCity) throw new Error('City "Москва" not found — run seed first');
  const moscowId = moscowCity.id;

  const moscowDistricts = await prisma.district.findMany({
    where: { cityId: moscowId },
    orderBy: { id: 'asc' },
  });
  if (moscowDistricts.length < 5) {
    throw new Error(`Expected >=5 Moscow districts, found ${moscowDistricts.length}`);
  }

  const allTags = await prisma.vibeTag.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  if (allTags.length < 3) {
    throw new Error(`Expected >=3 vibe tags, found ${allTags.length}`);
  }

  let processed = 0;
  for (const fake of FAKE_USERS) {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { telegramId: fake.telegramId },
        create: {
          telegramId: fake.telegramId,
          name: fake.name,
          scenario: fake.scenario,
          cityId: moscowId,
          budgetMin: fake.budgetMin,
          budgetMax: fake.budgetMax,
          smokingOk: fake.smokingOk,
          petsOk: fake.petsOk,
          noiseLevel: fake.noiseLevel,
          cleanliness: fake.cleanliness,
          sleepSchedule: fake.sleepSchedule,
          socialLevel: fake.socialLevel,
          workFromHome: fake.workFromHome,
          onboardingCompleted: true,
          quizCompleted: true,
          onboardingStep: 6,
          isActive: true,
        },
        update: {
          name: fake.name,
          scenario: fake.scenario,
          cityId: moscowId,
          budgetMin: fake.budgetMin,
          budgetMax: fake.budgetMax,
          smokingOk: fake.smokingOk,
          petsOk: fake.petsOk,
          noiseLevel: fake.noiseLevel,
          cleanliness: fake.cleanliness,
          sleepSchedule: fake.sleepSchedule,
          socialLevel: fake.socialLevel,
          workFromHome: fake.workFromHome,
          onboardingCompleted: true,
          quizCompleted: true,
          onboardingStep: 6,
          isActive: true,
        },
      });

      // Districts
      await tx.userDistrict.deleteMany({ where: { userId: user.id } });
      await tx.userDistrict.createMany({
        data: fake.districtIdxs.map((idx) => ({
          userId: user.id,
          districtId: moscowDistricts[idx].id,
        })),
        skipDuplicates: true,
      });

      // Vibe tags
      await tx.userVibeTag.deleteMany({ where: { userId: user.id } });
      await tx.userVibeTag.createMany({
        data: fake.tagIdxs.map((idx) => ({
          userId: user.id,
          tagId: allTags[idx].id,
        })),
        skipDuplicates: true,
      });

      // Quiz answers
      for (const a of fake.quizAnswers) {
        await tx.userQuizAnswer.upsert({
          where: { userId_questionId: { userId: user.id, questionId: a.questionId } },
          create: {
            userId: user.id,
            questionId: a.questionId,
            optionCode: a.optionCode,
            answerValue: a.answerValue,
          },
          update: {
            optionCode: a.optionCode,
            answerValue: a.answerValue,
          },
        });
      }
    });
    processed++;
  }

  console.log(`  Фейковых профилей обработано: ${processed}`);
}

// ---- Основная функция ----

async function main() {
  console.log('Сидинг базы данных...');

  // 1. Города
  console.log('Добавляем города...');
  await prisma.city.createMany({
    data: CITIES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const cities = await prisma.city.findMany({
    where: { name: { in: [...CITIES] } },
    select: { id: true, name: true },
  });
  const cityMap = new Map(cities.map((c) => [c.name, c.id]));

  // 2. Районы
  console.log('Добавляем районы...');
  for (const [cityName, districtNames] of Object.entries(DISTRICTS_BY_CITY)) {
    const cityId = cityMap.get(cityName);
    if (!cityId) {
      console.warn(`Город не найден: ${cityName}`);
      continue;
    }
    await prisma.district.createMany({
      data: districtNames.map((name) => ({ cityId, name })),
      skipDuplicates: true,
    });
  }

  // 3. Вопросы квиза (10 вопросов с детерминированными ID 1–10)
  console.log('Добавляем вопросы квиза...');
  const existingCount = await prisma.quizQuestion.count();

  if (existingCount === 0) {
    // Сбрасываем последовательность, чтобы ID были строго 1–10
    await prisma.$executeRaw`ALTER SEQUENCE quiz_questions_id_seq RESTART WITH 1`;

    for (const q of QUIZ_QUESTIONS) {
      await prisma.quizQuestion.create({
        data: {
          id: q.id,
          category: q.category,
          questionText: q.questionText,
          options: q.options as unknown as object[],
          displayOrder: q.displayOrder,
          isActive: true,
        },
      });
    }
  } else if (existingCount === 10) {
    console.log('Вопросы квиза уже добавлены, пропускаем.');
  } else {
    console.warn(
      `В таблице quiz_questions найдено ${existingCount} записей (ожидалось 0 или 10). Пропускаем вставку.`,
    );
  }

  // 4. Вайб-теги
  console.log('Добавляем вайб-теги...');
  await prisma.vibeTag.createMany({
    data: VIBE_TAGS.map((label) => ({ label })),
    skipDuplicates: true,
  });

  // 5. Фейковые профили для матчинга
  await seedFakeProfiles();

  // 6. Проверка целостности данных
  const quizCount = await prisma.quizQuestion.count();
  if (quizCount !== 10) {
    throw new Error(
      `Seed mismatch: ожидалось 10 вопросов квиза, найдено ${quizCount}`,
    );
  }

  const cityCount = await prisma.city.count();
  const districtCount = await prisma.district.count();
  const vibeTagCount = await prisma.vibeTag.count();
  const fakeCount = await prisma.user.count({ where: { onboardingCompleted: true } });

  console.log('Сидинг завершён успешно:');
  console.log(`  Городов: ${cityCount}`);
  console.log(`  Районов: ${districtCount}`);
  console.log(`  Вопросов квиза: ${quizCount}`);
  console.log(`  Вайб-тегов: ${vibeTagCount}`);
  console.log(`  Fake completed profiles: ${fakeCount}`);

  if (cityCount < 7) {
    throw new Error(`Seed mismatch: ожидалось 7 городов, найдено ${cityCount}`);
  }
  if (districtCount < 28) {
    throw new Error(
      `Seed mismatch: ожидалось минимум 28 районов, найдено ${districtCount}`,
    );
  }
  if (vibeTagCount < 20) {
    throw new Error(
      `Seed mismatch: ожидалось минимум 20 вайб-тегов, найдено ${vibeTagCount}`,
    );
  }
  if (fakeCount < 20) {
    throw new Error(`Seed mismatch: expected ≥20 completed profiles, found ${fakeCount}`);
  }
}

main()
  .catch((e) => {
    console.error('Ошибка сидинга:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
