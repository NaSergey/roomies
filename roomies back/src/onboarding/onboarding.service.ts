import { Injectable } from '@nestjs/common';
import { GuestsPreference, ScenarioType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetDto } from './dto/budget.dto';
import { DealbreakersDto } from './dto/dealbreakers.dto';
import { LocationDto } from './dto/location.dto';
import { ProfileDto } from './dto/profile.dto';
import { QuizDto } from './dto/quiz.dto';
import { ScenarioDto } from './dto/scenario.dto';

type Scale =
  | 'noiseLevel'
  | 'cleanliness'
  | 'sleepSchedule'
  | 'socialLevel'
  | 'workFromHome';

const SCALE_MAP: Record<number, Scale> = {
  1: 'noiseLevel',
  2: 'cleanliness',
  3: 'sleepSchedule',
  4: 'socialLevel',
  5: 'workFromHome',
  6: 'noiseLevel',
  7: 'cleanliness',
  8: 'sleepSchedule',
  9: 'socialLevel',
  10: 'workFromHome',
};

export function computeScales(
  answers: { questionId: number; answerValue: number }[],
): Partial<Record<Scale, number | null>> {
  const buckets: Record<Scale, number[]> = {
    noiseLevel: [],
    cleanliness: [],
    sleepSchedule: [],
    socialLevel: [],
    workFromHome: [],
  };

  for (const a of answers) {
    const scale = SCALE_MAP[a.questionId];
    if (scale) buckets[scale].push(a.answerValue);
  }

  const result: Partial<Record<Scale, number | null>> = {};
  for (const [scale, vals] of Object.entries(buckets) as [Scale, number[]][]) {
    result[scale] =
      vals.length > 0
        ? parseFloat(
            (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2),
          )
        : null;
  }

  return result;
}

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        onboardingStep: true,
        onboardingCompleted: true,
        quizCompleted: true,
        scenario: true,
        cityId: true,
        budgetMin: true,
        budgetMax: true,
        moveInDate: true,
        stayDurationMonths: true,
        smokingOk: true,
        petsOk: true,
        guestsPref: true,
        name: true,
        telegramPhotoUrl: true,
        districts: { select: { districtId: true } },
        vibeTags: { select: { tagId: true } },
      },
    });

    return {
      ...user,
      districtIds: user.districts.map((d) => d.districtId),
      vibeTagIds: user.vibeTags.map((t) => t.tagId),
    };
  }

  async saveScenario(userId: number, dto: ScenarioDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        scenario: dto.scenario as ScenarioType,
        onboardingStep: 1,
      },
    });
    return { ok: true };
  }

  async saveLocation(userId: number, dto: LocationDto) {
    const districtIds = dto.districtIds ?? [];
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { cityId: dto.cityId, onboardingStep: 2 },
      }),
      this.prisma.userDistrict.deleteMany({ where: { userId } }),
      ...(districtIds.length > 0
        ? [
            this.prisma.userDistrict.createMany({
              data: districtIds.map((districtId) => ({ userId, districtId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
    return { ok: true };
  }

  async saveBudget(userId: number, dto: BudgetDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : null,
        stayDurationMonths: dto.stayDurationMonths ?? null,
        onboardingStep: 3,
      },
    });
    return { ok: true };
  }

  async saveDealbreakers(userId: number, dto: DealbreakersDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        smokingOk: dto.smokingOk,
        petsOk: dto.petsOk,
        guestsPref: dto.guestsPref as GuestsPreference,
        onboardingStep: 4,
      },
    });
    return { ok: true };
  }

  // Не часть основной последовательности онбординга (см. saveScenario..saveProfile) —
  // вызывается отдельно из блока «вайб-квиз» в профиле, поэтому onboardingStep не трогаем.
  async saveQuiz(userId: number, dto: QuizDto) {
    const upsertOps = dto.answers.map((a) =>
      this.prisma.userQuizAnswer.upsert({
        where: {
          userId_questionId: { userId, questionId: a.questionId },
        },
        create: {
          userId,
          questionId: a.questionId,
          optionCode: a.optionCode,
          answerValue: a.answerValue,
        },
        update: {
          optionCode: a.optionCode,
          answerValue: a.answerValue,
        },
      }),
    );

    const scales = computeScales(dto.answers);

    await this.prisma.$transaction([
      ...upsertOps,
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...scales,
          quizCompleted: true,
        },
      }),
    ]);

    return { ok: true };
  }

  async saveProfile(userId: number, dto: ProfileDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { telegramPhotoUrl: true },
    });

    const photoUrls =
      dto.photoUrls && dto.photoUrls.length > 0
        ? dto.photoUrls
        : user.telegramPhotoUrl
          ? [user.telegramPhotoUrl]
          : [];

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          name: dto.name,
          onboardingStep: 5,
          onboardingCompleted: true,
        },
      }),
      this.prisma.userVibeTag.deleteMany({ where: { userId } }),
      ...(dto.vibeTagIds.length > 0
        ? [
            this.prisma.userVibeTag.createMany({
              data: dto.vibeTagIds.map((tagId) => ({ userId, tagId })),
              skipDuplicates: true,
            }),
          ]
        : []),
      this.prisma.userPhoto.deleteMany({ where: { userId } }),
      ...(photoUrls.length > 0
        ? [
            this.prisma.userPhoto.createMany({
              data: photoUrls.map((url, i) => ({
                userId,
                url,
                displayOrder: i,
              })),
            }),
          ]
        : []),
    ]);

    return { ok: true };
  }
}
