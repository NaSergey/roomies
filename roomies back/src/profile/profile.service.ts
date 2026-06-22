import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

function calculateAge(birthDate: Date | null): number | undefined {
  if (!birthDate) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() &&
      now.getDate() >= birthDate.getDate());
  if (!hadBirthdayThisYear) age--;
  return age;
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private computeRoomieScore(user: {
    photos: { url: string }[];
    quizCompleted: boolean;
    onboardingStep: number;
    isPhoneVerified: boolean;
  }): number {
    let score = 0;
    if (user.photos.length > 0) score += 10;
    if (user.quizCompleted) score += 10;
    if (user.onboardingStep >= 4) score += 10;
    if (user.isPhoneVerified) score += 10;
    return score;
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
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
        roomieScore: true,
        quizCompleted: true,
        onboardingStep: true,
        isPhoneVerified: true,
        photos: {
          select: { url: true },
          orderBy: { displayOrder: 'asc' },
        },
        vibeTags: {
          select: { tag: { select: { id: true, label: true } } },
        },
        districts: {
          select: { district: { select: { id: true, name: true } } },
        },
      },
    });

    const roomieScore = this.computeRoomieScore({
      photos: user.photos,
      quizCompleted: user.quizCompleted,
      onboardingStep: user.onboardingStep,
      isPhoneVerified: user.isPhoneVerified,
    });

    return {
      id: user.id,
      name: user.name,
      age: calculateAge(user.birthDate),
      scenario: user.scenario,
      budgetMin: user.budgetMin,
      budgetMax: user.budgetMax,
      smokingOk: user.smokingOk,
      petsOk: user.petsOk,
      guestsPref: user.guestsPref,
      photos: user.photos.map((p) => p.url),
      vibeTags: user.vibeTags.map((vt) => ({
        id: vt.tag.id,
        label: vt.tag.label,
      })),
      districts: user.districts.map((d) => ({
        id: d.district.id,
        name: d.district.name,
      })),
      lifestyleScales: {
        noiseLevel: user.noiseLevel ? Number(user.noiseLevel) : null,
        cleanliness: user.cleanliness ? Number(user.cleanliness) : null,
        sleepSchedule: user.sleepSchedule ? Number(user.sleepSchedule) : null,
        socialLevel: user.socialLevel ? Number(user.socialLevel) : null,
        workFromHome: user.workFromHome ? Number(user.workFromHome) : null,
      },
      roomieScore,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    // Build scalar update data from provided fields
    const scalarData: Record<string, unknown> = {};
    if (dto.name !== undefined) scalarData['name'] = dto.name;
    if (dto.budgetMin !== undefined) scalarData['budgetMin'] = dto.budgetMin;
    if (dto.budgetMax !== undefined) scalarData['budgetMax'] = dto.budgetMax;
    if (dto.smokingOk !== undefined) scalarData['smokingOk'] = dto.smokingOk;
    if (dto.petsOk !== undefined) scalarData['petsOk'] = dto.petsOk;
    if (dto.guestsPref !== undefined) scalarData['guestsPref'] = dto.guestsPref;

    // Build transaction operations
    const ops: Prisma.PrismaPromise<unknown>[] = [];

    // Update scalar fields if any are provided
    if (Object.keys(scalarData).length > 0) {
      ops.push(
        this.prisma.user.update({
          where: { id: userId },
          data: scalarData,
        }),
      );
    }

    // Replace photos if provided
    if (dto.photoUrls !== undefined) {
      ops.push(this.prisma.userPhoto.deleteMany({ where: { userId } }));
      if (dto.photoUrls.length > 0) {
        ops.push(
          this.prisma.userPhoto.createMany({
            data: dto.photoUrls.map((url, i) => ({
              userId,
              url,
              displayOrder: i,
            })),
          }),
        );
      }
    }

    // Replace vibe tags if provided
    if (dto.vibeTagIds !== undefined) {
      ops.push(this.prisma.userVibeTag.deleteMany({ where: { userId } }));
      if (dto.vibeTagIds.length > 0) {
        ops.push(
          this.prisma.userVibeTag.createMany({
            data: dto.vibeTagIds.map((tagId) => ({ userId, tagId })),
            skipDuplicates: true,
          }),
        );
      }
    }

    // Replace districts if provided
    if (dto.districtIds !== undefined) {
      ops.push(this.prisma.userDistrict.deleteMany({ where: { userId } }));
      if (dto.districtIds.length > 0) {
        ops.push(
          this.prisma.userDistrict.createMany({
            data: dto.districtIds.map((districtId) => ({ userId, districtId })),
            skipDuplicates: true,
          }),
        );
      }
    }

    // Execute all operations in a transaction if any
    if (ops.length > 0) {
      await this.prisma.$transaction(ops);
    }

    // Recompute and persist roomieScore
    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        photos: { select: { url: true } },
        quizCompleted: true,
        onboardingStep: true,
        isPhoneVerified: true,
      },
    });

    const roomieScore = this.computeRoomieScore(updated);
    await this.prisma.user.update({
      where: { id: userId },
      data: { roomieScore },
    });

    return this.getMe(userId);
  }
}
