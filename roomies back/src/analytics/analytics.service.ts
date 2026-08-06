import { Injectable, NotFoundException } from '@nestjs/common';
import { SwipeAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DayCount,
  buildDateRange,
  daysAgo,
  rate,
  startOfUtcDay,
  toCountMap,
  toDateKey,
} from './date-utils';
import { UsersQueryDto } from './dto/users-query.dto';

function emptyActionCounts(): Record<SwipeAction, number> {
  return { like: 0, super_like: 0, save: 0, pass: 0 };
}

function toActionCounts(
  rows: { action: SwipeAction; _count: { _all: number } }[],
): Record<SwipeAction, number> {
  const out = emptyActionCounts();
  for (const r of rows) out[r.action] = r._count._all;
  return out;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // ОБЗОР — ключевые метрики продукта одним снимком
  // ============================================================
  async getOverview() {
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const weekStart = daysAgo(6, now); // включая сегодня — 7-дневное окно
    const monthStart = daysAgo(29, now); // включая сегодня — 30-дневное окно

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      activeToday,
      activeWeek,
      activeMonth,
      onboardingCompleted,
      quizCompleted,
      totalMatches,
      matchesToday,
      totalMessages,
      messagesToday,
      totalSwipes,
      likeSwipes,
      phoneVerified,
      selfieVerified,
      studentVerified,
      purchaseAgg,
      purchaseTodayAgg,
      totalSquads,
      activeSquads,
      pendingReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.user.count({ where: { lastSeenAt: { gte: todayStart } } }),
      this.prisma.user.count({ where: { lastSeenAt: { gte: weekStart } } }),
      this.prisma.user.count({ where: { lastSeenAt: { gte: monthStart } } }),
      this.prisma.user.count({ where: { onboardingCompleted: true } }),
      this.prisma.user.count({ where: { quizCompleted: true } }),
      this.prisma.match.count(),
      this.prisma.match.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.message.count(),
      this.prisma.message.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.swipe.count(),
      this.prisma.swipe.count({
        where: { action: { in: ['like', 'super_like'] } },
      }),
      this.prisma.verification.count({
        where: { type: 'phone', status: 'verified' },
      }),
      this.prisma.verification.count({
        where: { type: 'selfie', status: 'verified' },
      }),
      this.prisma.verification.count({
        where: { type: 'student_email', status: 'verified' },
      }),
      this.prisma.purchase.aggregate({
        _sum: { amountCents: true },
        _count: true,
      }),
      this.prisma.purchase.aggregate({
        _sum: { amountCents: true },
        _count: true,
        where: { purchasedAt: { gte: todayStart } },
      }),
      this.prisma.squad.count(),
      this.prisma.squad.count({ where: { isActive: true } }),
      this.prisma.report.count({ where: { status: 'pending' } }),
    ]);

    return {
      generatedAt: now.toISOString(),
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newLast7d: newUsersWeek,
        newLast30d: newUsersMonth,
        // "Активен" = lastSeenAt в окне. DAU/WAU/MAU — снимок на текущий момент,
        // не историческая тайм-серия (lastSeenAt хранит только последний визит).
        activeToday,
        activeLast7d: activeWeek,
        activeLast30d: activeMonth,
      },
      onboarding: {
        quizCompleted,
        quizCompletedRate: rate(quizCompleted, totalUsers),
        onboardingCompleted,
        onboardingCompletedRate: rate(onboardingCompleted, totalUsers),
      },
      matching: {
        totalSwipes,
        likeSwipes,
        totalMatches,
        matchesToday,
        // Каждый мэтч расходует ровно 2 взаимных лайка/суперлайка.
        likeToMatchRate: rate(totalMatches * 2, likeSwipes),
      },
      messaging: {
        totalMessages,
        messagesToday,
      },
      verification: {
        phoneVerified,
        selfieVerified,
        studentVerified,
      },
      revenue: {
        totalRevenueCents: purchaseAgg._sum.amountCents ?? 0,
        totalPurchases: purchaseAgg._count,
        revenueTodayCents: purchaseTodayAgg._sum.amountCents ?? 0,
        purchasesToday: purchaseTodayAgg._count,
      },
      squads: {
        total: totalSquads,
        active: activeSquads,
      },
      safety: {
        pendingReports,
      },
    };
  }

  // ============================================================
  // РОСТ — регистрации по дням + накопительный итог
  // ============================================================
  async getGrowth(days: number) {
    const since = daysAgo(days - 1);

    const [rows, baseline] = await Promise.all([
      this.prisma.$queryRaw<DayCount[]>`
        SELECT date_trunc('day', created_at) AS day, COUNT(*)::int AS count
        FROM users
        WHERE created_at >= ${since}
        GROUP BY 1
        ORDER BY 1
      `,
      this.prisma.user.count({ where: { createdAt: { lt: since } } }),
    ]);

    const counts = toCountMap(rows);
    let cumulative = baseline;
    const series = buildDateRange(days, since).map((date) => {
      const newUsers = counts.get(date) ?? 0;
      cumulative += newUsers;
      return { date, newUsers, cumulativeUsers: cumulative };
    });

    return { days, since: toDateKey(since), series };
  }

  // ============================================================
  // ВОВЛЕЧЁННОСТЬ — свайпы/мэтчи/сообщения по дням
  // ============================================================
  async getEngagement(days: number) {
    const since = daysAgo(days - 1);

    const [swipeRows, matchRows, messageRows] = await Promise.all([
      this.prisma.$queryRaw<DayCount[]>`
        SELECT date_trunc('day', created_at) AS day, COUNT(*)::int AS count
        FROM swipes WHERE created_at >= ${since} GROUP BY 1 ORDER BY 1
      `,
      this.prisma.$queryRaw<DayCount[]>`
        SELECT date_trunc('day', created_at) AS day, COUNT(*)::int AS count
        FROM matches WHERE created_at >= ${since} GROUP BY 1 ORDER BY 1
      `,
      this.prisma.$queryRaw<DayCount[]>`
        SELECT date_trunc('day', created_at) AS day, COUNT(*)::int AS count
        FROM messages WHERE created_at >= ${since} GROUP BY 1 ORDER BY 1
      `,
    ]);

    const swipes = toCountMap(swipeRows);
    const matches = toCountMap(matchRows);
    const messages = toCountMap(messageRows);

    const series = buildDateRange(days, since).map((date) => ({
      date,
      swipes: swipes.get(date) ?? 0,
      matches: matches.get(date) ?? 0,
      messages: messages.get(date) ?? 0,
    }));

    return { days, since: toDateKey(since), series };
  }

  // ============================================================
  // ВОРОНКА АКТИВАЦИИ — регистрация → квиз → онбординг → свайп → мэтч → сообщение
  // ============================================================
  async getFunnel() {
    const [
      registered,
      quizCompleted,
      onboardingCompleted,
      swipedUsers,
      matchedUsers,
      messagedUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { quizCompleted: true } }),
      this.prisma.user.count({ where: { onboardingCompleted: true } }),
      this.prisma.swipe
        .findMany({ distinct: ['actorId'], select: { actorId: true } })
        .then((r) => r.length),
      this.prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT uid)::int AS count FROM (
          SELECT user1_id AS uid FROM matches
          UNION
          SELECT user2_id AS uid FROM matches
        ) t
      `.then((r) => r[0]?.count ?? 0),
      this.prisma.message
        .findMany({ distinct: ['senderId'], select: { senderId: true } })
        .then((r) => r.length),
    ]);

    const raw = [
      { step: 'registered', label: 'Регистрация', count: registered },
      {
        step: 'quiz_completed',
        label: 'Прошли вайб-квиз',
        count: quizCompleted,
      },
      {
        step: 'onboarding_completed',
        label: 'Завершили онбординг',
        count: onboardingCompleted,
      },
      {
        step: 'first_swipe',
        label: 'Сделали первый свайп',
        count: swipedUsers,
      },
      { step: 'first_match', label: 'Получили мэтч', count: matchedUsers },
      { step: 'first_message', label: 'Написали в чат', count: messagedUsers },
    ];

    return {
      steps: raw.map((s, i) => ({
        ...s,
        rateOfTotal: rate(s.count, registered),
        rateOfPrevious: i === 0 ? 1 : rate(s.count, raw[i - 1].count),
      })),
    };
  }

  // ============================================================
  // РАСПРЕДЕЛЕНИЕ ПО ГОРОДАМ И СЦЕНАРИЯМ
  // ============================================================
  async getCities() {
    const rows = await this.prisma.user.groupBy({
      by: ['cityId'],
      _count: { _all: true },
    });
    const cityIds = rows
      .map((r) => r.cityId)
      .filter((id): id is number => id !== null);
    const cities = cityIds.length
      ? await this.prisma.city.findMany({
          where: { id: { in: cityIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(cities.map((c) => [c.id, c.name]));

    return rows
      .map((r) => ({
        cityId: r.cityId,
        cityName:
          r.cityId !== null
            ? (nameById.get(r.cityId) ?? 'Неизвестно')
            : 'Не указан',
        users: r._count._all,
      }))
      .sort((a, b) => b.users - a.users);
  }

  async getScenarios() {
    const rows = await this.prisma.user.groupBy({
      by: ['scenario'],
      _count: { _all: true },
    });
    return rows
      .map((r) => ({ scenario: r.scenario, users: r._count._all }))
      .sort((a, b) => b.users - a.users);
  }

  // ============================================================
  // СПИСОК ПОЛЬЗОВАТЕЛЕЙ — таблица CRM с поиском/фильтрами/сортировкой
  // ============================================================
  async getUsers(query: UsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDir = query.sortDir ?? 'desc';

    const where = {
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
              {
                telegramUsername: {
                  contains: query.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: query.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(query.scenario ? { scenario: query.scenario } : {}),
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.onboardingCompleted !== undefined
        ? { onboardingCompleted: query.onboardingCompleted }
        : {}),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          publicId: true,
          name: true,
          telegramUsername: true,
          email: true,
          scenario: true,
          roomieScore: true,
          isActive: true,
          onboardingCompleted: true,
          quizCompleted: true,
          createdAt: true,
          lastSeenAt: true,
          city: { select: { name: true } },
          _count: {
            select: {
              matchesAsUser1: true,
              matchesAsUser2: true,
              messagesSent: true,
              reportsReceived: true,
            },
          },
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items: users.map((u) => ({
        id: u.id,
        publicId: u.publicId,
        name: u.name,
        telegramUsername: u.telegramUsername,
        email: u.email,
        scenario: u.scenario,
        city: u.city?.name ?? null,
        roomieScore: u.roomieScore,
        isActive: u.isActive,
        onboardingCompleted: u.onboardingCompleted,
        quizCompleted: u.quizCompleted,
        matchesCount: u._count.matchesAsUser1 + u._count.matchesAsUser2,
        messagesCount: u._count.messagesSent,
        reportsReceivedCount: u._count.reportsReceived,
        createdAt: u.createdAt,
        lastSeenAt: u.lastSeenAt,
      })),
    };
  }

  // ============================================================
  // ДЕТАЛЬНАЯ КАРТОЧКА ПОЛЬЗОВАТЕЛЯ
  // ============================================================
  async getUserDetail(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        publicId: true,
        name: true,
        telegramId: true,
        telegramUsername: true,
        telegramPhotoUrl: true,
        languageCode: true,
        email: true,
        phone: true,
        birthDate: true,
        scenario: true,
        role: true,
        city: { select: { id: true, name: true } },
        budgetMin: true,
        budgetMax: true,
        moveInDate: true,
        stayDurationMonths: true,
        smokingOk: true,
        petsOk: true,
        guestsPref: true,
        noiseLevel: true,
        cleanliness: true,
        sleepSchedule: true,
        socialLevel: true,
        workFromHome: true,
        roomieScore: true,
        isPhoneVerified: true,
        isSelfieVerified: true,
        isStudentVerified: true,
        onboardingStep: true,
        onboardingCompleted: true,
        quizCompleted: true,
        isActive: true,
        boostedUntil: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
        referredBy: { select: { id: true, name: true, publicId: true } },
        photos: {
          select: { id: true, url: true, displayOrder: true },
          orderBy: { displayOrder: 'asc' },
        },
        vibeTags: { select: { tag: { select: { label: true } } } },
        districts: { select: { district: { select: { name: true } } } },
        notificationPrefs: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const [
      matchesCount,
      swipesGivenRows,
      swipesReceivedRows,
      messagesSentCount,
      quizAnswersCount,
      reportsGivenCount,
      reportsReceivedCount,
      blocksGivenCount,
      blocksReceivedCount,
      verifications,
      purchases,
      referralsCount,
      squadMembership,
      recentActivity,
    ] = await Promise.all([
      this.prisma.match.count({
        where: { OR: [{ user1Id: id }, { user2Id: id }] },
      }),
      this.prisma.swipe.groupBy({
        by: ['action'],
        where: { actorId: id },
        _count: { _all: true },
      }),
      this.prisma.swipe.groupBy({
        by: ['action'],
        where: { targetId: id },
        _count: { _all: true },
      }),
      this.prisma.message.count({ where: { senderId: id } }),
      this.prisma.userQuizAnswer.count({ where: { userId: id } }),
      this.prisma.report.count({ where: { reporterId: id } }),
      this.prisma.report.count({ where: { reportedId: id } }),
      this.prisma.block.count({ where: { blockerId: id } }),
      this.prisma.block.count({ where: { blockedId: id } }),
      this.prisma.verification.findMany({
        where: { userId: id },
        select: { type: true, status: true, verifiedAt: true, createdAt: true },
      }),
      this.prisma.purchase.findMany({
        where: { userId: id },
        select: {
          productType: true,
          amountCents: true,
          currency: true,
          store: true,
          purchasedAt: true,
        },
        orderBy: { purchasedAt: 'desc' },
      }),
      this.prisma.user.count({ where: { referredById: id } }),
      this.prisma.squadMember.findFirst({
        where: { userId: id },
        select: {
          role: true,
          joinedAt: true,
          squad: { select: { id: true, name: true, isActive: true } },
        },
      }),
      this.prisma.behavioralEvent.findMany({
        where: { actorId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { eventType: true, targetId: true, createdAt: true },
      }),
    ]);

    const totalSpentCents = purchases.reduce(
      (sum, p) => sum + p.amountCents,
      0,
    );

    return {
      profile: {
        id: user.id,
        publicId: user.publicId,
        name: user.name,
        telegramId: user.telegramId?.toString() ?? null,
        telegramUsername: user.telegramUsername,
        telegramPhotoUrl: user.telegramPhotoUrl,
        languageCode: user.languageCode,
        email: user.email,
        phone: user.phone,
        birthDate: user.birthDate,
        scenario: user.scenario,
        role: user.role,
        city: user.city?.name ?? null,
        budgetMin: user.budgetMin,
        budgetMax: user.budgetMax,
        moveInDate: user.moveInDate,
        stayDurationMonths: user.stayDurationMonths,
        smokingOk: user.smokingOk,
        petsOk: user.petsOk,
        guestsPref: user.guestsPref,
        lifestyleScales: {
          noiseLevel: user.noiseLevel,
          cleanliness: user.cleanliness,
          sleepSchedule: user.sleepSchedule,
          socialLevel: user.socialLevel,
          workFromHome: user.workFromHome,
        },
        roomieScore: user.roomieScore,
        isPhoneVerified: user.isPhoneVerified,
        isSelfieVerified: user.isSelfieVerified,
        isStudentVerified: user.isStudentVerified,
        onboardingStep: user.onboardingStep,
        onboardingCompleted: user.onboardingCompleted,
        quizCompleted: user.quizCompleted,
        isActive: user.isActive,
        boostedUntil: user.boostedUntil,
        lastSeenAt: user.lastSeenAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        photos: user.photos,
        vibeTags: user.vibeTags.map((t) => t.tag.label),
        districts: user.districts.map((d) => d.district.name),
        notificationPrefs: user.notificationPrefs,
      },
      activity: {
        matchesCount,
        messagesSentCount,
        quizAnswersCount,
        swipesGiven: toActionCounts(swipesGivenRows),
        swipesReceived: toActionCounts(swipesReceivedRows),
        recentEvents: recentActivity,
      },
      trust: {
        reportsGivenCount,
        reportsReceivedCount,
        blocksGivenCount,
        blocksReceivedCount,
        verifications,
      },
      monetization: {
        totalSpentCents,
        purchases,
      },
      referrals: {
        referredByUser: user.referredBy,
        referralsCount,
      },
      squad: squadMembership,
    };
  }
}
