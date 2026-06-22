import { ForbiddenException, Injectable } from '@nestjs/common';
import { GuestsPreference, Prisma, ScenarioType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeedQueryDto } from './dto/feed-query.dto';

function calculateAge(birthDate: Date | null): number | undefined {
  if (!birthDate) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!hadBirthdayThisYear) age--;
  return age;
}

type UserWithScores = {
  id: number;
  name: string;
  birthDate: Date | null;
  scenario: ScenarioType;
  budgetMin: number | null;
  budgetMax: number | null;
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: GuestsPreference;
  noiseLevel: object | null;
  cleanliness: object | null;
  sleepSchedule: object | null;
  socialLevel: object | null;
  workFromHome: object | null;
  photos: { url: string }[];
  vibeTags: { tag: { id: number; label: string } }[];
  districts: { district: { id: number; name: string } }[];
  _matchScore?: number;
};

type UserScoreFields = {
  budgetMin: number | null;
  budgetMax: number | null;
  smokingOk: boolean;
  petsOk: boolean;
  guestsPref: GuestsPreference;
  noiseLevel: object | null;
  cleanliness: object | null;
  sleepSchedule: object | null;
  socialLevel: object | null;
  workFromHome: object | null;
};

function hasHardConflict(me: UserScoreFields, candidate: UserScoreFields): boolean {
  // Budget non-overlap
  if (
    me.budgetMax != null &&
    candidate.budgetMin != null &&
    me.budgetMax < candidate.budgetMin
  ) {
    return true;
  }
  if (
    me.budgetMin != null &&
    candidate.budgetMax != null &&
    me.budgetMin > candidate.budgetMax
  ) {
    return true;
  }

  // Smoking conflict: one requires no smoking, the other is OK with smoking
  if (!me.smokingOk && candidate.smokingOk) return true;
  if (!candidate.smokingOk && me.smokingOk) return true;

  // Pets conflict
  if (!me.petsOk && candidate.petsOk) return true;
  if (!candidate.petsOk && me.petsOk) return true;

  return false;
}

function computeLifestyleScore(me: UserScoreFields, candidate: UserScoreFields): number {
  const scales = [
    'noiseLevel',
    'cleanliness',
    'sleepSchedule',
    'socialLevel',
    'workFromHome',
  ] as const;

  const diffs: number[] = [];
  for (const scale of scales) {
    const meVal = me[scale];
    const candidateVal = candidate[scale];
    if (meVal != null && candidateVal != null) {
      diffs.push(Math.abs(Number(meVal) - Number(candidateVal)));
    }
  }

  if (diffs.length === 0) return 0.5;

  const avgDiff = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
  return 1 - avgDiff;
}

export function generateMatchReasons(
  me: UserScoreFields,
  candidate: UserScoreFields,
): string[] {
  const reasons: string[] = [];

  // Lifestyle scale comparisons — use Number() cast for Decimal fields
  if (
    me.sleepSchedule != null &&
    candidate.sleepSchedule != null &&
    Math.abs(Number(me.sleepSchedule) - Number(candidate.sleepSchedule)) < 0.2
  ) {
    reasons.push('Похожий режим сна');
  }

  if (
    me.noiseLevel != null &&
    candidate.noiseLevel != null &&
    Math.abs(Number(me.noiseLevel) - Number(candidate.noiseLevel)) < 0.2
  ) {
    const avg = (Number(me.noiseLevel) + Number(candidate.noiseLevel)) / 2;
    reasons.push(avg < 0.5 ? 'Оба предпочитают тишину дома' : 'Одинаковое отношение к шуму');
  }

  if (
    me.cleanliness != null &&
    candidate.cleanliness != null &&
    Math.abs(Number(me.cleanliness) - Number(candidate.cleanliness)) < 0.2
  ) {
    reasons.push('Одинаковый подход к чистоте');
  }

  if (
    me.socialLevel != null &&
    candidate.socialLevel != null &&
    Math.abs(Number(me.socialLevel) - Number(candidate.socialLevel)) < 0.2
  ) {
    reasons.push('Схожий уровень общительности');
  }

  if (
    me.workFromHome != null &&
    candidate.workFromHome != null &&
    Math.abs(Number(me.workFromHome) - Number(candidate.workFromHome)) < 0.2
  ) {
    reasons.push('Похожий режим работы');
  }

  if (!me.smokingOk && !candidate.smokingOk) {
    reasons.push('Оба не курят');
  }

  if (me.petsOk && candidate.petsOk) {
    reasons.push('Оба любят питомцев');
  }

  if (me.guestsPref && candidate.guestsPref && me.guestsPref === candidate.guestsPref) {
    reasons.push('Одинаковое отношение к гостям');
  }

  return reasons.slice(0, 3);
}

export function generateMatchRisks(
  me: UserScoreFields,
  candidate: UserScoreFields,
): string[] {
  const risks: string[] = [];

  if (
    (me.guestsPref === GuestsPreference.rarely && candidate.guestsPref === GuestsPreference.often) ||
    (me.guestsPref === GuestsPreference.often && candidate.guestsPref === GuestsPreference.rarely)
  ) {
    risks.push('Разное отношение к гостям — обсудите при знакомстве');
  }

  return risks.slice(0, 1);
}

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: number, query: FeedQueryDto = {}) {
    // Step 1 — Load current user
    const me = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        cityId: true,
        scenario: true,
        budgetMin: true,
        budgetMax: true,
        smokingOk: true,
        petsOk: true,
        guestsPref: true,
        noiseLevel: true,
        cleanliness: true,
        sleepSchedule: true,
        socialLevel: true,
        workFromHome: true,
        onboardingCompleted: true,
        isActive: true,
      },
    });

    if (!me.onboardingCompleted || !me.isActive) {
      throw new ForbiddenException('Complete onboarding to access the feed');
    }

    // Step 2 — Get already swiped IDs
    const swiped = await this.prisma.swipe.findMany({
      where: { actorId: userId },
      select: { targetId: true },
    });
    const swipedIds = swiped.map((s) => s.targetId);

    // Step 3 — Scenario compatibility map (exhaustive)
    const scenarioCompat: Record<ScenarioType, ScenarioType[]> = {
      looking_housing_roomie: ['looking_housing_roomie', 'has_housing_seeking_roomie'],
      has_housing_seeking_roomie: ['looking_housing_roomie', 'has_housing_seeking_roomie'],
      looking_roomie_find_housing: ['looking_roomie_find_housing'],
      squad: ['squad'],
    };
    const compatibleScenarios = scenarioCompat[me.scenario];

    // Step 4 — Build query filters
    // Budget filter: query params override me's budget bounds
    const effectiveBudgetMin = query.budgetMin ?? me.budgetMin;
    const effectiveBudgetMax = query.budgetMax ?? me.budgetMax;

    const budgetFilter: Prisma.UserWhereInput[] = [];
    if (effectiveBudgetMax != null) {
      budgetFilter.push({ OR: [{ budgetMin: null }, { budgetMin: { lte: effectiveBudgetMax } }] });
    }
    if (effectiveBudgetMin != null) {
      budgetFilter.push({ OR: [{ budgetMax: null }, { budgetMax: { gte: effectiveBudgetMin } }] });
    }

    // Dealbreaker filters: query params override me's preferences
    const effectiveSmokingOk = query.smokingOk !== undefined ? query.smokingOk : me.smokingOk;
    const effectivePetsOk = query.petsOk !== undefined ? query.petsOk : me.petsOk;

    const whereClause: Prisma.UserWhereInput = {
      id: { not: userId, notIn: swipedIds },
      cityId: me.cityId ?? -1,
      scenario: { in: compatibleScenarios },
      onboardingCompleted: true,
      isActive: true,
      smokingOk: effectiveSmokingOk,
      petsOk: effectivePetsOk,
      AND: budgetFilter,
    };

    // Optional guestsPref filter
    if (query.guestsPref !== undefined) {
      whereClause.guestsPref = query.guestsPref;
    }

    // Optional district filter
    if (query.districtIds && query.districtIds.length > 0) {
      whereClause.districts = { some: { districtId: { in: query.districtIds } } };
    }

    const candidates = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        birthDate: true,
        scenario: true,
        budgetMin: true,
        budgetMax: true,
        smokingOk: true,
        petsOk: true,
        guestsPref: true,
        noiseLevel: true,
        cleanliness: true,
        sleepSchedule: true,
        socialLevel: true,
        workFromHome: true,
        photos: {
          select: { url: true },
          orderBy: { displayOrder: 'asc' },
          take: 3,
        },
        vibeTags: {
          select: { tag: { select: { id: true, label: true } } },
        },
        districts: {
          select: { district: { select: { id: true, name: true } } },
        },
      },
      take: 100,
    });

    // Step 5 — Score each candidate
    const meScoreFields: UserScoreFields = {
      budgetMin: me.budgetMin,
      budgetMax: me.budgetMax,
      smokingOk: me.smokingOk,
      petsOk: me.petsOk,
      guestsPref: me.guestsPref,
      noiseLevel: me.noiseLevel,
      cleanliness: me.cleanliness,
      sleepSchedule: me.sleepSchedule,
      socialLevel: me.socialLevel,
      workFromHome: me.workFromHome,
    };

    const scored = (candidates as UserWithScores[])
      .filter((c) => !hasHardConflict(meScoreFields, c))
      .map((c) => ({
        ...c,
        _matchScore: computeLifestyleScore(meScoreFields, c),
      }));

    // Step 6 — Sort by matchScore descending, take top 20
    scored.sort((a, b) => (b._matchScore ?? 0) - (a._matchScore ?? 0));
    const top20 = scored.slice(0, 20);

    // Step 7 — Map to response shape
    return top20.map((c) => ({
      id: c.id,
      name: c.name,
      age: calculateAge(c.birthDate),
      scenario: c.scenario,
      budgetMin: c.budgetMin,
      budgetMax: c.budgetMax,
      smokingOk: c.smokingOk,
      petsOk: c.petsOk,
      guestsPref: c.guestsPref,
      photos: c.photos.map((p) => p.url),
      vibeTags: c.vibeTags.map((vt) => ({ id: vt.tag.id, label: vt.tag.label })),
      districts: c.districts.map((d) => ({
        id: d.district.id,
        name: d.district.name,
      })),
      lifestyleScales: {
        noiseLevel: c.noiseLevel ? Number(c.noiseLevel) : null,
        cleanliness: c.cleanliness ? Number(c.cleanliness) : null,
        sleepSchedule: c.sleepSchedule ? Number(c.sleepSchedule) : null,
        socialLevel: c.socialLevel ? Number(c.socialLevel) : null,
        workFromHome: c.workFromHome ? Number(c.workFromHome) : null,
      },
      matchScore: c._matchScore,
      matchReasons: generateMatchReasons(meScoreFields, c),
      matchRisks: generateMatchRisks(meScoreFields, c),
    }));
  }
}
