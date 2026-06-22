import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ScenarioType } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

// Сколько пользователей сгенерировать и с какого telegramId начинать
// (1100000001–1100000100 уже заняты основным seed.ts).
const COUNT = 1000;
const TELEGRAM_ID_START = 1_200_000_001n;

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
  noiseLevel: number;
  cleanliness: number;
  sleepSchedule: number;
  socialLevel: number;
  workFromHome: number;
  districtIdxs: [number, number];
  tagIdxs: [number, number, number];
}

function generateUsers(count: number): GeneratedUser[] {
  const users: GeneratedUser[] = [];
  for (let i = 0; i < count; i++) {
    const isMale = Math.random() < 0.5;
    const first = isMale ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
    const lastBase = pick(LAST_NAMES);
    const last = isMale ? lastBase : `${lastBase}а`;

    const budgetMin = 18000 + Math.floor(Math.random() * 18) * 1000;
    const budgetMax = budgetMin + 10000 + Math.floor(Math.random() * 20) * 1000;

    users.push({
      telegramId: TELEGRAM_ID_START + BigInt(i),
      name: `${first} ${last}`,
      birthDate: randomBirthDate(),
      scenario: pick(SCENARIOS),
      budgetMin,
      budgetMax,
      smokingOk: Math.random() < 0.2,
      petsOk: Math.random() < 0.4,
      noiseLevel: round2(Math.random()),
      cleanliness: round2(Math.random()),
      sleepSchedule: round2(Math.random()),
      socialLevel: round2(Math.random()),
      workFromHome: round2(Math.random()),
      districtIdxs: pickTwoDistinct(5),
      tagIdxs: pickThreeDistinct(22),
    });
  }
  return users;
}

async function main(): Promise<void> {
  console.log(`Генерируем ${COUNT} тестовых пользователей...`);

  const moscowCity = await prisma.city.findFirst({ where: { name: 'Москва' } });
  if (!moscowCity) throw new Error('City "Москва" not found — run `npx prisma db seed` first');
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
  if (allTags.length < 22) {
    throw new Error(`Expected >=22 vibe tags, found ${allTags.length}`);
  }

  const generated = generateUsers(COUNT);

  // 1. Bulk-вставка пользователей
  await prisma.user.createMany({
    data: generated.map((u) => ({
      telegramId: u.telegramId,
      name: u.name,
      birthDate: u.birthDate,
      scenario: u.scenario,
      cityId: moscowId,
      budgetMin: u.budgetMin,
      budgetMax: u.budgetMax,
      smokingOk: u.smokingOk,
      petsOk: u.petsOk,
      noiseLevel: u.noiseLevel,
      cleanliness: u.cleanliness,
      sleepSchedule: u.sleepSchedule,
      socialLevel: u.socialLevel,
      workFromHome: u.workFromHome,
      onboardingCompleted: true,
      quizCompleted: true,
      onboardingStep: 6,
      isActive: true,
    })),
    skipDuplicates: true,
  });
  console.log('  Пользователи вставлены, подтягиваем их id...');

  // 2. Подтягиваем id только что вставленных пользователей по диапазону telegramId
  const inserted = await prisma.user.findMany({
    where: {
      telegramId: {
        gte: TELEGRAM_ID_START,
        lt: TELEGRAM_ID_START + BigInt(COUNT),
      },
    },
    select: { id: true, telegramId: true },
  });
  const idByTelegramId = new Map(inserted.map((u) => [u.telegramId.toString(), u.id]));

  // 3. Bulk-вставка районов, тегов и ответов квиза
  const districtRows: { userId: number; districtId: number }[] = [];
  const tagRows: { userId: number; tagId: number }[] = [];
  const quizRows: { userId: number; questionId: number; optionCode: string; answerValue: number }[] = [];

  for (const u of generated) {
    const userId = idByTelegramId.get(u.telegramId.toString());
    if (userId == null) continue; // skipDuplicates пропустил — telegramId уже существовал

    for (const idx of u.districtIdxs) {
      districtRows.push({ userId, districtId: moscowDistricts[idx].id });
    }
    for (const idx of u.tagIdxs) {
      tagRows.push({ userId, tagId: allTags[idx].id });
    }
    for (const a of makeQuizAnswers(u.noiseLevel, u.cleanliness, u.sleepSchedule, u.socialLevel, u.workFromHome)) {
      quizRows.push({ userId, ...a });
    }
  }

  await prisma.userDistrict.createMany({ data: districtRows, skipDuplicates: true });
  console.log(`  Районы привязаны: ${districtRows.length}`);

  await prisma.userVibeTag.createMany({ data: tagRows, skipDuplicates: true });
  console.log(`  Теги привязаны: ${tagRows.length}`);

  await prisma.userQuizAnswer.createMany({ data: quizRows, skipDuplicates: true });
  console.log(`  Ответы квиза вставлены: ${quizRows.length}`);

  console.log(`Готово: добавлено ${inserted.length} пользователей.`);
}

main()
  .catch((e) => {
    console.error('Ошибка bulk-сидинга:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
