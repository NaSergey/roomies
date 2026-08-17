import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma, ScenarioType, MessageType } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

// ============================================================
// Демо-данные ПОД КОНКРЕТНОГО пользователя.
//
// Отличие от seed-bulk-users.ts: тот сыплет случайных людей по всем городам, и
// в ленту они почти не попадают — getFeed отбирает кандидатов ЖЁСТКО (см.
// src/feed/feed.service.ts, шаг 4):
//   cityId  — строго равен моему;
//   scenario — из списка совместимых с моим;
//   курение / питомцы — конфликт по паре «он курит + я не терплю» и наоборот
//     (см. hasHardConflict); поэтому кандидату хватает не создавать конфликт,
//     точное совпадение флагов больше не требуется;
//   бюджет — диапазоны должны пересекаться;
//   плюс отсев уже свайпнутых.
// Поэтому здесь кандидаты генерируются ОТ ПРОФИЛЯ цели, а не наугад.
// ============================================================

/** Кого «прокачиваем». Telegram-аккаунт https://t.me/Na_Sergey. */
const TARGET_TELEGRAM_ID = 942_600_000n + 1_074n; // 942601074
/** Можно переопределить из окружения: TARGET_EMAIL=... или TARGET_TELEGRAM_ID=... */
const TARGET_EMAIL = process.env['TARGET_EMAIL'] ?? null;

/** Сколько анкет должно остаться видимыми в ленте. */
const FEED_USERS = 200;
/** Сколько мэтчей с перепиской. Эти люди создаются СВЕРХ FEED_USERS и уходят
 *  из ленты (у мэтча по определению есть свайп), поэтому лента остаётся ровно
 *  FEED_USERS карточек. */
const CHAT_COUNT = 8;

/** Бюджет цели, если он не заполнен. Пустой бюджет (0–0) делает ленту пустой в
 *  принципе: фильтр требует у кандидата budgetMin <= моего budgetMax. */
const FALLBACK_BUDGET_MIN = 30_000;
const FALLBACK_BUDGET_MAX = 60_000;

// Диапазон telegramId под эти данные — заведомо выше занятого bulk-сидом
// (он занимает 1_200_000_001 + 7 городов * 1000).
const TELEGRAM_ID_START = 1_300_000_001n;

const PRAVATAR_COUNT = 70;

const FIRST_NAMES_M = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём',
  'Илья', 'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений',
  'Иван', 'Денис', 'Евгений', 'Тимур', 'Владимир', 'Павел', 'Глеб', 'Степан',
];
const FIRST_NAMES_F = [
  'Анна', 'Мария', 'Елена', 'Дарья', 'Екатерина', 'Ольга', 'Наталья', 'Юлия',
  'Алина', 'Полина', 'Виктория', 'Ксения', 'Татьяна', 'Светлана', 'Ирина',
  'Валерия', 'Кристина', 'Софья', 'Алёна', 'Диана', 'Елизавета', 'Яна',
];
const LAST_NAMES = [
  'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев', 'Новиков',
  'Морозов', 'Волков', 'Алексеев', 'Орлов', 'Семёнов', 'Егоров', 'Павлов',
  'Козлов', 'Степанов', 'Николаев', 'Фёдоров', 'Михайлов', 'Беляев',
  'Тарасов', 'Белов', 'Комаров', 'Киселёв', 'Макаров', 'Андреев', 'Захаров',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function randomBirthDate(): Date {
  const ageYears = 18 + Math.floor(Math.random() * 13); // 18–30, целевая аудитория
  const date = new Date();
  date.setFullYear(date.getFullYear() - ageYears);
  date.setDate(date.getDate() - Math.floor(Math.random() * 365));
  return date;
}

function makeQuizAnswers(n: number, c: number, sl: number, so: number, w: number) {
  return [
    { questionId: 1,  ...(n  >= 0.5 ? { optionCode: 'silence',        answerValue: 1.0 } : { optionCode: 'noise',             answerValue: 0.0 }) },
    { questionId: 2,  ...(c  >= 0.7 ? { optionCode: 'clean_often',    answerValue: 1.0 } : { optionCode: 'clean_sometimes',   answerValue: 0.3 }) },
    { questionId: 3,  ...(sl >= 0.5 ? { optionCode: 'sleep_early',    answerValue: 1.0 } : { optionCode: 'sleep_late',        answerValue: 0.0 }) },
    { questionId: 4,  ...(so >= 0.5 ? { optionCode: 'social_yes',     answerValue: 1.0 } : { optionCode: 'social_no',         answerValue: 0.0 }) },
    { questionId: 5,  ...(w  >= 0.5 ? { optionCode: 'wfh_yes',        answerValue: 1.0 } : { optionCode: 'wfh_no',            answerValue: 0.0 }) },
    { questionId: 6,  ...(n  >= 0.5 ? { optionCode: 'quiet_evening',  answerValue: 1.0 } : { optionCode: 'noise_evening_ok',  answerValue: 0.0 }) },
    { questionId: 7,  ...(c  >= 0.5 ? { optionCode: 'clean_always',   answerValue: 1.0 } : { optionCode: 'clean_reasonable',  answerValue: 0.5 }) },
    { questionId: 8,  ...(sl >= 0.5 ? { optionCode: 'morning_person', answerValue: 1.0 } : { optionCode: 'not_morning',       answerValue: 0.0 }) },
    { questionId: 9,  ...(so >= 0.5 ? { optionCode: 'guests_welcome', answerValue: 1.0 } : { optionCode: 'guests_privacy',    answerValue: 0.0 }) },
    { questionId: 10, ...(w  >= 0.5 ? { optionCode: 'home_work',      answerValue: 1.0 } : { optionCode: 'home_sleep',        answerValue: 0.0 }) },
  ];
}

/** Реплики для переписок. Первая всегда от партнёра — так в списке мэтчей
 *  видно осмысленное превью, а не «сообщений пока нет». */
const DIALOG: { from: 'partner' | 'me'; text: string }[] = [
  { from: 'partner', text: 'Привет! Увидел(а) твою анкету — вроде по вайбу совпадаем 🙌' },
  { from: 'me',      text: 'Привет! Ага, тоже так подумал. Ты уже смотришь варианты?' },
  { from: 'partner', text: 'Смотрю, но пока без фанатизма. Хочу въехать к началу следующего месяца' },
  { from: 'me',      text: 'Отлично, у меня примерно те же сроки' },
  { from: 'partner', text: 'А по району есть предпочтения? Я бы хотел(а) поближе к метро' },
  { from: 'me',      text: 'Тоже за метро в пешей доступности. Главное чтобы не час до центра' },
  { from: 'partner', text: 'Полностью согласен(на) 😄 А по бюджету на что ориентируешься?' },
  { from: 'me',      text: 'Комфортно до 30 на человека, но если квартира огонь — можно обсудить' },
  { from: 'partner', text: 'Звучит адекватно. Я примерно так же считаю' },
  { from: 'partner', text: 'Слушай, а ты как относишься к гостям по выходным?' },
  { from: 'me',      text: 'Нормально, если не каждые выходные и предупреждать заранее' },
  { from: 'partner', text: 'Идеально. Я как раз за «предупредить и всё ок» 👌' },
  { from: 'me',      text: 'Тогда осталось найти саму квартиру 😅' },
  { from: 'partner', text: 'Кинул(а) тебе пару ссылок, глянь на досуге' },
  { from: 'me',      text: 'Гляну вечером, спасибо!' },
  { from: 'partner', text: 'Может созвонимся на неделе, обсудим детали?' },
  { from: 'me',      text: 'Давай. Мне удобно после 19' },
  { from: 'partner', text: 'Тогда во вторник в 19:30?' },
  { from: 'me',      text: 'Договорились 🤝' },
  { from: 'partner', text: 'Супер! До вторника ✌️' },
];

/** Причины совпадения — то, что рисуется на карточке и в «Почему вы совпали». */
const MATCH_REASONS = [
  'Похожий режим сна',
  'Оба за тишину после 23:00',
  'Совпадает отношение к чистоте',
  'Похожий уровень общительности',
  'Оба работают из дома',
  'Бюджеты сходятся',
];

async function resolveTarget() {
  const where: Prisma.UserWhereInput = TARGET_EMAIL
    ? { email: TARGET_EMAIL }
    : { telegramId: TARGET_TELEGRAM_ID };

  const user = await prisma.user.findFirst({
    where,
    select: {
      id: true, name: true, email: true, telegramId: true, telegramUsername: true,
      cityId: true, scenario: true, budgetMin: true, budgetMax: true,
      smokingOk: true, petsOk: true, smokes: true, hasPets: true, guestsPref: true,
      onboardingCompleted: true, quizCompleted: true, isActive: true,
      noiseLevel: true, cleanliness: true, sleepSchedule: true,
      socialLevel: true, workFromHome: true,
    },
  });

  if (!user) {
    throw new Error(
      TARGET_EMAIL
        ? `Пользователь с email ${TARGET_EMAIL} не найден`
        : `Пользователь с telegramId ${TARGET_TELEGRAM_ID} не найден. ` +
          'Зайди в приложение хотя бы раз или укажи TARGET_EMAIL=...',
    );
  }
  return user;
}

async function main(): Promise<void> {
  const target = await resolveTarget();
  console.log(
    `Цель: #${target.id} ${target.name} ` +
      `(tg ${target.telegramId?.toString() ?? '—'}${target.telegramUsername ? ' @' + target.telegramUsername : ''}` +
      `${target.email ? ', ' + target.email : ''})`,
  );

  // ── Профиль цели: чиним то, из-за чего лента физически не может наполниться.
  const fixes: Prisma.UserUpdateInput = {};
  const budgetEmpty =
    target.budgetMin == null || target.budgetMax == null ||
    target.budgetMax <= 0 || target.budgetMin >= target.budgetMax;
  if (budgetEmpty) {
    fixes.budgetMin = FALLBACK_BUDGET_MIN;
    fixes.budgetMax = FALLBACK_BUDGET_MAX;
  }
  if (target.cityId == null) fixes.city = { connect: { id: 1 } };
  if (!target.onboardingCompleted) {
    fixes.onboardingCompleted = true;
    fixes.onboardingStep = 5;
  }
  if (!target.isActive) fixes.isActive = true;
  // Шкалы нужны, чтобы matchScore считался не «по умолчанию 0.5», а осмысленно.
  if (target.noiseLevel == null) fixes.noiseLevel = 0.7;
  if (target.cleanliness == null) fixes.cleanliness = 0.75;
  if (target.sleepSchedule == null) fixes.sleepSchedule = 0.6;
  if (target.socialLevel == null) fixes.socialLevel = 0.55;
  if (target.workFromHome == null) fixes.workFromHome = 0.65;
  if (!target.quizCompleted) fixes.quizCompleted = true;

  if (Object.keys(fixes).length > 0) {
    await prisma.user.update({ where: { id: target.id }, data: fixes });
    console.log('  Профиль поправлен:', Object.keys(fixes).join(', '));
  }

  const cityId = target.cityId ?? 1;
  const budgetMin = budgetEmpty ? FALLBACK_BUDGET_MIN : target.budgetMin!;
  const budgetMax = budgetEmpty ? FALLBACK_BUDGET_MAX : target.budgetMax!;

  // ── Сценарий кандидата: только совместимый с моим (тот же список, что в feed.service).
  const scenarioCompat: Record<ScenarioType, ScenarioType[]> = {
    looking_housing_roomie: ['looking_housing_roomie', 'has_housing_seeking_roomie'],
    has_housing_seeking_roomie: ['looking_housing_roomie', 'has_housing_seeking_roomie'],
    looking_roomie_find_housing: ['looking_roomie_find_housing'],
    squad: ['squad'],
  };
  const scenarios = scenarioCompat[target.scenario];

  const districts = await prisma.district.findMany({
    where: { cityId }, orderBy: { id: 'asc' }, select: { id: true },
  });
  const tags = await prisma.vibeTag.findMany({ orderBy: { id: 'asc' }, select: { id: true } });
  if (districts.length === 0) throw new Error(`У города ${cityId} нет районов — запусти основной seed`);
  if (tags.length === 0) throw new Error('Нет вайб-тегов — запусти основной seed');

  const total = FEED_USERS + CHAT_COUNT;

  // ── Генерация кандидатов ПОД профиль цели.
  const generated = Array.from({ length: total }, (_, i) => {
    const isMale = Math.random() < 0.5;
    const lastBase = pick(LAST_NAMES);
    const name = `${isMale ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F)} ${isMale ? lastBase : lastBase + 'а'}`;

    // Бюджет гарантированно пересекается с бюджетом цели: нижняя граница не
    // выше моего максимума, верхняя не ниже моего минимума.
    const candMin = Math.max(5_000, budgetMin - 5_000 + Math.floor(Math.random() * 10) * 1_000);
    const candMax = Math.max(candMin + 5_000, budgetMax - 5_000 + Math.floor(Math.random() * 15) * 1_000);

    return {
      telegramId: TELEGRAM_ID_START + BigInt(i),
      name,
      birthDate: randomBirthDate(),
      scenario: pick(scenarios),
      budgetMin: candMin,
      budgetMax: candMax,
      // Кандидат не должен создавать жёсткий конфликт с целью, но и клонировать
      // её ответы больше не нужно: курит — только если цель это терпит; терпит —
      // обязательно, если курит сама цель. В остальном свободен.
      smokes: target.smokingOk ? Math.random() < 0.5 : false,
      hasPets: target.petsOk ? Math.random() < 0.4 : false,
      smokingOk: target.smokes ? true : Math.random() < 0.3,
      petsOk: target.hasPets ? true : Math.random() < 0.5,
      noiseLevel: round2(Math.random()),
      cleanliness: round2(Math.random()),
      sleepSchedule: round2(Math.random()),
      socialLevel: round2(Math.random()),
      workFromHome: round2(Math.random()),
      districtIdx: Math.floor(Math.random() * districts.length),
      districtIdx2: Math.floor(Math.random() * districts.length),
      tagIdxs: [0, 1, 2].map(() => Math.floor(Math.random() * tags.length)),
      photoSeed: i % PRAVATAR_COUNT,
    };
  });

  await prisma.user.createMany({
    data: generated.map((u) => ({
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
      guestsPref: target.guestsPref,
      noiseLevel: u.noiseLevel,
      cleanliness: u.cleanliness,
      sleepSchedule: u.sleepSchedule,
      socialLevel: u.socialLevel,
      workFromHome: u.workFromHome,
      onboardingCompleted: true,
      quizCompleted: true,
      onboardingStep: 5,
      isActive: true,
      roomieScore: 20 + Math.floor(Math.random() * 20),
    })),
    skipDuplicates: true,
  });

  const inserted = await prisma.user.findMany({
    where: { telegramId: { gte: TELEGRAM_ID_START, lt: TELEGRAM_ID_START + BigInt(total) } },
    select: { id: true, telegramId: true, name: true },
    orderBy: { telegramId: 'asc' },
  });
  const idByTg = new Map(inserted.map((u) => [u.telegramId!.toString(), u.id]));
  console.log(`  Пользователей создано/найдено: ${inserted.length}`);

  // ── Связи: районы, теги, ответы квиза, фото.
  const districtRows: { userId: number; districtId: number }[] = [];
  const tagRows: { userId: number; tagId: number }[] = [];
  const quizRows: { userId: number; questionId: number; optionCode: string; answerValue: number }[] = [];
  const photoRows: { userId: number; url: string; displayOrder: number }[] = [];

  for (const u of generated) {
    const userId = idByTg.get(u.telegramId.toString());
    if (userId == null) continue;
    districtRows.push({ userId, districtId: districts[u.districtIdx]!.id });
    if (u.districtIdx2 !== u.districtIdx) {
      districtRows.push({ userId, districtId: districts[u.districtIdx2]!.id });
    }
    for (const idx of new Set(u.tagIdxs)) tagRows.push({ userId, tagId: tags[idx]!.id });
    for (const a of makeQuizAnswers(u.noiseLevel, u.cleanliness, u.sleepSchedule, u.socialLevel, u.workFromHome)) {
      quizRows.push({ userId, ...a });
    }
    // Три фото: карточка ленты показывает главное + два «пузырька».
    for (let p = 0; p < 3; p++) {
      photoRows.push({
        userId,
        url: `https://i.pravatar.cc/500?img=${((u.photoSeed + p * 7) % PRAVATAR_COUNT) + 1}`,
        displayOrder: p,
      });
    }
  }

  await prisma.userDistrict.createMany({ data: districtRows, skipDuplicates: true });
  await prisma.userVibeTag.createMany({ data: tagRows, skipDuplicates: true });
  await prisma.userQuizAnswer.createMany({ data: quizRows, skipDuplicates: true });
  await prisma.userPhoto.createMany({ data: photoRows, skipDuplicates: true });
  console.log(`  Районы ${districtRows.length}, теги ${tagRows.length}, квиз ${quizRows.length}, фото ${photoRows.length}`);

  // ── Мэтчи + чаты + переписка.
  // Партнёров берём с ХВОСТА списка, чтобы в ленте осталось ровно FEED_USERS:
  // у мэтча есть взаимный свайп, а getFeed отсеивает уже свайпнутых.
  const partners = inserted.slice(FEED_USERS, FEED_USERS + CHAT_COUNT);
  let createdChats = 0;

  for (const [i, partner] of partners.entries()) {
    // Инвариант схемы: user1Id < user2Id (Prisma не умеет CHECK, держим руками).
    const [user1Id, user2Id] =
      target.id < partner.id ? [target.id, partner.id] : [partner.id, target.id];

    const existing = await prisma.match.findUnique({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      select: { id: true },
    });
    if (existing) continue;

    // Разная длина истории: от пары реплик до полного диалога.
    const msgCount = [2, 3, 5, 7, 10, 13, 16, 20][i % 8]!;
    // Мэтч тем «старее», чем длиннее переписка — список сортируется по дате.
    const matchAgeHours = 2 + i * 9;
    const matchedAt = new Date(Date.now() - matchAgeHours * 3600_000);

    const reasons = [...MATCH_REASONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 2));

    const match = await prisma.match.create({
      data: {
        user1Id,
        user2Id,
        matchScore: new Prisma.Decimal((0.68 + Math.random() * 0.3).toFixed(4)),
        lifestyleScore: new Prisma.Decimal((0.6 + Math.random() * 0.35).toFixed(4)),
        matchReasons: reasons,
        isActive: true,
        createdAt: matchedAt,
        chat: { create: { createdAt: matchedAt } },
      },
      include: { chat: true },
    });

    // Свайпы обеих сторон — иначе мэтч «повис» без причины, и, главное,
    // партнёр остался бы висеть в ленте (getFeed отсеивает по swipes).
    await prisma.swipe.createMany({
      data: [
        { actorId: target.id, targetId: partner.id, action: 'like', createdAt: matchedAt },
        { actorId: partner.id, targetId: target.id, action: 'like', createdAt: matchedAt },
      ],
      skipDuplicates: true,
    });

    const chatId = match.chat!.id;
    const slice = DIALOG.slice(0, msgCount);
    // Сообщения раскладываем по времени от момента мэтча до «недавно».
    const stepMs = Math.floor((matchAgeHours * 3600_000 - 600_000) / Math.max(1, slice.length));

    await prisma.message.createMany({
      data: slice.map((m, idx) => ({
        chatId,
        senderId: m.from === 'me' ? target.id : partner.id,
        content: m.text,
        messageType: MessageType.text,
        createdAt: new Date(matchedAt.getTime() + stepMs * (idx + 1)),
      })),
    });

    // Каждый третий чат оставляем с непрочитанными — чтобы в списке был бейдж.
    const lastMsgAt = new Date(matchedAt.getTime() + stepMs * slice.length);
    const hasUnread = i % 3 === 0;
    await prisma.chatRead.upsert({
      where: { chatId_userId: { chatId, userId: target.id } },
      create: {
        chatId,
        userId: target.id,
        lastReadAt: hasUnread ? new Date(matchedAt.getTime() + stepMs) : lastMsgAt,
      },
      update: {
        lastReadAt: hasUnread ? new Date(matchedAt.getTime() + stepMs) : lastMsgAt,
      },
    });

    createdChats++;
    console.log(`  Чат с ${partner.name}: ${slice.length} сообщений${hasUnread ? ' (есть непрочитанные)' : ''}`);
  }

  // ── Проверка: столько же карточек реально отдаст лента?
  const swipedIds = (
    await prisma.swipe.findMany({ where: { actorId: target.id }, select: { targetId: true } })
  ).map((s) => s.targetId);

  const feedCount = await prisma.user.count({
    where: {
      id: { not: target.id, notIn: swipedIds },
      cityId,
      scenario: { in: scenarios },
      onboardingCompleted: true,
      isActive: true,
      AND: [
        { OR: [{ budgetMin: null }, { budgetMin: { lte: budgetMax } }] },
        { OR: [{ budgetMax: null }, { budgetMax: { gte: budgetMin } }] },
        // Повторяет dealbreakerFilter из feed.service.ts — счётчик должен
        // мерить ту же ленту, которую увидит пользователь.
        ...(target.smokingOk ? [] : [{ smokes: false }]),
        ...(target.smokes ? [{ smokingOk: true }] : []),
        ...(target.petsOk ? [] : [{ hasPets: false }]),
        ...(target.hasPets ? [{ petsOk: true }] : []),
      ],
    },
  });

  console.log('\nГотово.');
  console.log(`  Мэтчей с чатами создано: ${createdChats}`);
  console.log(`  Подходящих под ленту анкет всего: ${feedCount} (лента отдаёт по 100 за раз)`);
}

main()
  .catch((e) => {
    console.error('Ошибка сидинга:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
