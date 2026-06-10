import { Injectable } from '@nestjs/common';
import { ScenarioType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type UserWithScores = {
  id: number;
  name: string;
  scenario: ScenarioType;
  budgetMin: number | null;
  budgetMax: number | null;
  smokingOk: boolean;
  petsOk: boolean;
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

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: number) {
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
        noiseLevel: true,
        cleanliness: true,
        sleepSchedule: true,
        socialLevel: true,
        workFromHome: true,
      },
    });

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

    // Step 4 — Query candidates
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { not: userId, notIn: swipedIds },
        cityId: me.cityId ?? -1,
        scenario: { in: compatibleScenarios },
        onboardingCompleted: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        scenario: true,
        budgetMin: true,
        budgetMax: true,
        smokingOk: true,
        petsOk: true,
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
    const scored = (candidates as UserWithScores[])
      .filter((c) => !hasHardConflict(me, c))
      .map((c) => ({
        ...c,
        _matchScore: computeLifestyleScore(me, c),
      }));

    // Step 6 — Sort by matchScore descending, take top 20
    scored.sort((a, b) => (b._matchScore ?? 0) - (a._matchScore ?? 0));
    const top20 = scored.slice(0, 20);

    // Step 7 — Map to response shape
    return top20.map((c) => ({
      id: c.id,
      name: c.name,
      scenario: c.scenario,
      budgetMin: c.budgetMin,
      budgetMax: c.budgetMax,
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
    }));
  }
}
