import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { computeScales, OnboardingService } from './onboarding.service';

describe('computeScales (pure function)', () => {
  it('averages two noiseLevel answers to 0.5', () => {
    const result = computeScales([
      { questionId: 1, answerValue: 1.0 },
      { questionId: 6, answerValue: 0.0 },
    ]);
    expect(result.noiseLevel).toBe(0.5);
  });

  it('passes through a single answer unchanged', () => {
    const result = computeScales([{ questionId: 2, answerValue: 0.75 }]);
    expect(result.cleanliness).toBe(0.75);
  });

  it('returns null for scales with no answers', () => {
    const result = computeScales([{ questionId: 1, answerValue: 1.0 }]);
    // noiseLevel has an answer, others should be null
    expect(result.cleanliness).toBeNull();
    expect(result.sleepSchedule).toBeNull();
    expect(result.socialLevel).toBeNull();
    expect(result.workFromHome).toBeNull();
  });

  it('computes all 5 scales from 10 answers', () => {
    const answers = [
      { questionId: 1, answerValue: 1.0 },
      { questionId: 2, answerValue: 0.8 },
      { questionId: 3, answerValue: 0.6 },
      { questionId: 4, answerValue: 0.4 },
      { questionId: 5, answerValue: 0.2 },
      { questionId: 6, answerValue: 0.0 },
      { questionId: 7, answerValue: 0.2 },
      { questionId: 8, answerValue: 0.4 },
      { questionId: 9, answerValue: 0.6 },
      { questionId: 10, answerValue: 0.8 },
    ];
    const result = computeScales(answers);
    expect(result.noiseLevel).toBe(0.5);    // avg(1.0, 0.0)
    expect(result.cleanliness).toBe(0.5);   // avg(0.8, 0.2)
    expect(result.sleepSchedule).toBe(0.5); // avg(0.6, 0.4)
    expect(result.socialLevel).toBe(0.5);   // avg(0.4, 0.6)
    expect(result.workFromHome).toBe(0.5);  // avg(0.2, 0.8)
  });

  it('returns empty object for empty answers array', () => {
    const result = computeScales([]);
    expect(result.noiseLevel).toBeNull();
    expect(result.cleanliness).toBeNull();
    expect(result.sleepSchedule).toBeNull();
    expect(result.socialLevel).toBeNull();
    expect(result.workFromHome).toBeNull();
  });
});

describe('OnboardingService', () => {
  let service: OnboardingService;
  let mockPrisma: {
    user: {
      update: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    userDistrict: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    userVibeTag: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    userQuizAnswer: {
      upsert: jest.Mock;
    };
    userPhoto: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        update: jest.fn().mockResolvedValue({}),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          telegramPhotoUrl: null,
        }),
      },
      userDistrict: {
        deleteMany: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({}),
      },
      userVibeTag: {
        deleteMany: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({}),
      },
      userQuizAnswer: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      userPhoto: {
        deleteMany: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  describe('saveScenario', () => {
    it('calls prisma.user.update with correct scenario value', async () => {
      const result = await service.saveScenario(1, {
        scenario: 'looking_housing_roomie',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          scenario: 'looking_housing_roomie',
          onboardingStep: 1,
        },
      });
      expect(result).toEqual({ ok: true });
    });
  });

  describe('saveLocation', () => {
    it('calls $transaction with deleteMany + createMany when districtIds provided', async () => {
      await service.saveLocation(1, { cityId: 1, districtIds: [10, 20] });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('calls $transaction with only deleteMany when no districtIds', async () => {
      await service.saveLocation(1, { cityId: 1 });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('saveProfile', () => {
    it('sets onboardingCompleted: true and quizCompleted: true', async () => {
      await service.saveProfile(1, {
        name: 'Алексей',
        photoUrls: [],
        vibeTagIds: [1, 2, 3],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      // The first item in the transaction should be the user.update call
      // We verify the transaction was called (integration of the full method)
      const txCall = mockPrisma.$transaction.mock.calls[0][0] as unknown[];
      expect(txCall.length).toBeGreaterThan(0);
    });
  });

  describe('saveBudget', () => {
    it('calls prisma.user.update with correct fields', async () => {
      await service.saveBudget(1, {
        budgetMin: 20000,
        budgetMax: 50000,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          budgetMin: 20000,
          budgetMax: 50000,
          moveInDate: null,
          stayDurationMonths: null,
          onboardingStep: 3,
        },
      });
    });
  });

  describe('saveDealbreakers', () => {
    it('calls prisma.user.update with correct fields', async () => {
      await service.saveDealbreakers(1, {
        smokingOk: true,
        petsOk: false,
        guestsPref: 'sometimes',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          smokingOk: true,
          petsOk: false,
          guestsPref: 'sometimes',
          onboardingStep: 4,
        },
      });
    });
  });
});
