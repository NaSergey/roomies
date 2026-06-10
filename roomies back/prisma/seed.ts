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

  // 5. Проверка целостности данных
  const quizCount = await prisma.quizQuestion.count();
  if (quizCount !== 10) {
    throw new Error(
      `Seed mismatch: ожидалось 10 вопросов квиза, найдено ${quizCount}`,
    );
  }

  const cityCount = await prisma.city.count();
  const districtCount = await prisma.district.count();
  const vibeTagCount = await prisma.vibeTag.count();

  console.log('Сидинг завершён успешно:');
  console.log(`  Городов: ${cityCount}`);
  console.log(`  Районов: ${districtCount}`);
  console.log(`  Вопросов квиза: ${quizCount}`);
  console.log(`  Вайб-тегов: ${vibeTagCount}`);

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
}

main()
  .catch((e) => {
    console.error('Ошибка сидинга:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
