import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ScenarioType } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

// Сколько пользователей генерируем НА КАЖДЫЙ город и с какого telegramId начинать
// (1100000001–1100000100 уже заняты основным seed.ts). Диапазон на город:
// TELEGRAM_ID_START + cityIndex*COUNT_PER_CITY .. +COUNT_PER_CITY-1.
const COUNT_PER_CITY = 1000;
const TELEGRAM_ID_START = 1_200_000_001n;

// Postgres ограничивает запрос 65535 параметрами — берём запас на самую
// «широкую» таблицу (users, ~16 колонок) и используем один размер чанка везде.
const CHUNK_SIZE = 2000;

// Заглушки для фото — «человеческие» аватарки, контент не важен (тестовые данные),
// pravatar.cc отдаёт ограниченный, но стабильный набор (img=1..70) без API-ключа.
const PRAVATAR_COUNT = 70;

const FIRST_NAMES_M = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём',
  'Илья', 'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений',
  'Иван', 'Денис', 'Евгений', 'Тимур', 'Владимир', 'Павел', 'Глеб', 'Степан',
  'Фёдор', 'Юрий', 'Виктор', 'Игорь', 'Константин', 'Олег', 'Григорий',
];

const FIRST_NAMES_F = [
  'Анна', 'Мария', 'Елена', 'Дарья', 'Екатерина', 'Ольга', 'Наталья', 'Юлия',
  'Алина', 'Полина', 'Виктория', 'Ксения', 'Татьяна', 'Светлана', 'Ирина',
  'Валерия', 'Кристина', 'Софья', 'Вера', 'Надежда', 'Алёна', 'Диана',
  'Жанна', 'Зоя', 'Людмила', 'Нина', 'Оксана', 'Елизавета', 'Маргарита', 'Яна',
];

const LAST_NAMES = [
  'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев', 'Новиков',
  'Морозов', 'Волков', 'Алексеев', 'Орлов', 'Семёнов', 'Егоров', 'Павлов',
  'Козлов', 'Степанов', 'Николаев', 'Фёдоров', 'Михайлов', 'Беляев',
  'Тарасов', 'Белов', 'Комаров', 'Киселёв', 'Макаров', 'Андреев', 'Захаров',
  'Зайцев', 'Соловьёв', 'Борисов', 'Васильев', 'Антонов', 'Никитин',
  'Карпов', 'Воробьёв', 'Гусев', 'Поляков', 'Медведев', 'Громов', 'Климов',
];

const SCENARIOS: ScenarioType[] = [
  'looking_housing_roomie',
  'has_housing_seeking_roomie',
  'looking_housing_roomie',
  'has_housing_seeking_roomie',
  'looking_roomie_find_housing',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTwoDistinct(max: number): [number, number] {
  const a = Math.floor(Math.random() * max);
  let b = Math.floor(Math.random() * max);
  if (b === a) b = (b + 1) % max;
  return [a, b];
}

function pickThreeDistinct(max: number): [number, number, number] {
  const set = new Set<number>();
  while (set.size < 3) set.add(Math.floor(Math.random() * max));
  const [a, b, c] = [...set];
  return [a, b, c];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function insertChunked<T>(
  label: string,
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>,
): Promise<void> {
  for (const batch of chunk(rows, CHUNK_SIZE)) {
    await insert(batch);
  }
  console.log(`  ${label}: ${rows.length}`);
}

// Случайная дата рождения 18–30 лет (целевая аудитория проекта).
function randomBirthDate(): Date {
  const ageYears = 18 + Math.floor(Math.random() * 13);
  const dayOffset = Math.floor(Math.random() * 365);
  const date = new Date();
  date.setFullYear(date.getFullYear() - ageYears);
  date.setDate(date.getDate() - dayOffset);
  return date;
}

function makeQuizAnswers(n: number, c: number, sl: number, so: number, w: number) {
  return [
    { questionId: 1, ...(n >= 0.5 ? { optionCode: 'silence', answerValue: 1.0 } : { optionCode: 'noise', answerValue: 0.0 }) },
    { questionId: 2, ...(c >= 0.7 ? { optionCode: 'clean_often', answerValue: 1.0 } : { optionCode: 'clean_sometimes', answerValue: 0.3 }) },
    { questionId: 3, ...(sl >= 0.5 ? { optionCode: 'sleep_early', answerValue: 1.0 } : { optionCode: 'sleep_late', answerValue: 0.0 }) },
    { questionId: 4, ...(so >= 0.5 ? { optionCode: 'social_yes', answerValue: 1.0 } : { optionCode: 'social_no', answerValue: 0.0 }) },
    { questionId: 5, ...(w >= 0.5 ? { optionCode: 'wfh_yes', answerValue: 1.0 } : { optionCode: 'wfh_no', answerValue: 0.0 }) },
    { questionId: 6, ...(n >= 0.5 ? { optionCode: 'quiet_evening', answerValue: 1.0 } : { optionCode: 'noise_evening_ok', answerValue: 0.0 }) },
    { questionId: 7, ...(c >= 0.5 ? { optionCode: 'clean_always', answerValue: 1.0 } : { optionCode: 'clean_reasonable', answerValue: 0.5 }) },
    { questionId: 8, ...(sl >= 0.5 ? { optionCode: 'morning_person', answerValue: 1.0 } : { optionCode: 'not_morning', answerValue: 0.0 }) },
    { questionId: 9, ...(so >= 0.5 ? { optionCode: 'guests_welcome', answerValue: 1.0 } : { optionCode: 'guests_privacy', answerValue: 0.0 }) },
    { questionId: 10, ...(w >= 0.5 ? { optionCode: 'home_work', answerValue: 1.0 } : { optionCode: 'home_sleep', answerValue: 0.0 }) },
  ];
}

interface GeneratedUser {
  telegramId: bigint;
  name: string;
  birthDate: Date;
  scenario: ScenarioType;
  budgetMin: number;
  budgetMax: number;
  smokingOk: boolean;
  petsOk: boolean;
  smokes: boolean;
  hasPets: boolean;
  noiseLevel: number;
  cleanliness: number;
  sleepSchedule: number;
  socialLevel: number;
  workFromHome: number;
  districtIdxs: [number, number];
  tagIdxs: [number, number, number];
  photoSeed: number;
}

function generateUsers(
  count: number,
  telegramIdStart: bigint,
  districtCount: number,
  photoSeedStart: number,
): GeneratedUser[] {
  const users: GeneratedUser[] = [];
  for (let i = 0; i < count; i++) {
    const isMale = Math.random() < 0.5;
    const first = isMale ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
    const lastBase = pick(LAST_NAMES);
    const last = isMale ? lastBase : `${lastBase}а`;

    const budgetMin = 18000 + Math.floor(Math.random() * 18) * 1000;
    const budgetMax = budgetMin + 10000 + Math.floor(Math.random() * 20) * 1000;

    // Терпимость и своё поведение — разные вопросы, но не независимые:
    // курящий почти всегда спокойно относится к курению, а владелец питомца —
    // к питомцам. Поэтому сначала бросаем терпимость, а «своё» разыгрываем
    // только внутри терпимых: обратная пара (курю, но курения не терплю)
    // засоряла бы ленту людьми, несовместимыми вообще ни с кем.
    const smokingOk = Math.random() < 0.2;
    const petsOk = Math.random() < 0.4;

    users.push({
      telegramId: telegramIdStart + BigInt(i),
      name: `${first} ${last}`,
      birthDate: randomBirthDate(),
      scenario: pick(SCENARIOS),
      budgetMin,
      budgetMax,
      smokingOk,
      petsOk,
      smokes: smokingOk && Math.random() < 0.5,
      hasPets: petsOk && Math.random() < 0.35,
      noiseLevel: round2(Math.random()),
      cleanliness: round2(Math.random()),
      sleepSchedule: round2(Math.random()),
      socialLevel: round2(Math.random()),
      workFromHome: round2(Math.random()),
      districtIdxs: pickTwoDistinct(districtCount),
      tagIdxs: pickThreeDistinct(22),
      photoSeed: (photoSeedStart + i) % PRAVATAR_COUNT,
    });
  }
  return users;
}

async function seedCity(cityId: number, cityName: string, telegramIdStart: bigint): Promise<number> {
  const districts = await prisma.district.findMany({
    where: { cityId },
    orderBy: { id: 'asc' },
  });
  if (districts.length < 2) {
    console.warn(`  Пропускаем ${cityName}: меньше 2 районов (${districts.length})`);
    return 0;
  }

  const allTags = await prisma.vibeTag.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  if (allTags.length < 22) {
    throw new Error(`Expected >=22 vibe tags, found ${allTags.length}`);
  }

  const generated = generateUsers(COUNT_PER_CITY, telegramIdStart, districts.length, Number(telegramIdStart % 1000n));

  await insertChunked('Пользователи вставлены', generated, (batch) =>
    prisma.user.createMany({
      data: batch.map((u) => ({
        telegramId: u.telegramId,
        name: u.name,
        birthDate: u.birthDate,
        scenario: u.scenario,
        cityId,
        budgetMin: u.budgetMin,
        budgetMax: u.budgetMax,
        smokingOk: u.smokingOk,
        petsOk: u.petsOk,
        smokes: u.smokes,
        hasPets: u.hasPets,
        noiseLevel: u.noiseLevel,
        cleanliness: u.cleanliness,
        sleepSchedule: u.sleepSchedule,
        socialLevel: u.socialLevel,
        workFromHome: u.workFromHome,
        onboardingCompleted: true,
        quizCompleted: true,
        onboardingStep: 5,
        isActive: true,
      })),
      skipDuplicates: true,
    }),
  );

  const inserted = await prisma.user.findMany({
    where: {
      telegramId: { gte: telegramIdStart, lt: telegramIdStart + BigInt(COUNT_PER_CITY) },
    },
    select: { id: true, telegramId: true },
  });
  const idByTelegramId = new Map(inserted.map((u) => [u.telegramId!.toString(), u.id]));

  const districtRows: { userId: number; districtId: number }[] = [];
  const tagRows: { userId: number; tagId: number }[] = [];
  const quizRows: { userId: number; questionId: number; optionCode: string; answerValue: number }[] = [];
  const photoRows: { userId: number; url: string; displayOrder: number }[] = [];

  for (const u of generated) {
    const userId = idByTelegramId.get(u.telegramId.toString());
    if (userId == null) continue; // skipDuplicates пропустил — telegramId уже существовал

    for (const idx of u.districtIdxs) {
      districtRows.push({ userId, districtId: districts[idx].id });
    }
    for (const idx of u.tagIdxs) {
      tagRows.push({ userId, tagId: allTags[idx].id });
    }
    for (const a of makeQuizAnswers(u.noiseLevel, u.cleanliness, u.sleepSchedule, u.socialLevel, u.workFromHome)) {
      quizRows.push({ userId, ...a });
    }
    photoRows.push({
      userId,
      url: `https://i.pravatar.cc/500?img=${u.photoSeed + 1}`,
      displayOrder: 0,
    });
  }

  await insertChunked('Районы привязаны', districtRows, (batch) =>
    prisma.userDistrict.createMany({ data: batch, skipDuplicates: true }),
  );
  await insertChunked('Теги привязаны', tagRows, (batch) =>
    prisma.userVibeTag.createMany({ data: batch, skipDuplicates: true }),
  );
  await insertChunked('Ответы квиза вставлены', quizRows, (batch) =>
    prisma.userQuizAnswer.createMany({ data: batch, skipDuplicates: true }),
  );
  await insertChunked('Фото вставлены', photoRows, (batch) =>
    prisma.userPhoto.createMany({ data: batch, skipDuplicates: true }),
  );

  return inserted.length;
}

async function main(): Promise<void> {
  const cities = await prisma.city.findMany({ orderBy: { id: 'asc' } });
  if (cities.length === 0) {
    throw new Error('Города не найдены — сначала запусти `npx prisma db seed`');
  }

  console.log(`Генерируем по ${COUNT_PER_CITY} тестовых пользователей на каждый из ${cities.length} городов...`);

  let total = 0;
  for (const [i, city] of cities.entries()) {
    const telegramIdStart = TELEGRAM_ID_START + BigInt(i) * BigInt(COUNT_PER_CITY);
    console.log(`Город: ${city.name}`);
    total += await seedCity(city.id, city.name, telegramIdStart);
  }

  console.log(`Готово: добавлено ${total} пользователей.`);
}

main()
  .catch((e) => {
    console.error('Ошибка bulk-сидинга:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
