import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const prismaMock = {
      user: {
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      userPhoto: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      userVibeTag: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      userDistrict: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prisma = module.get(PrismaService);
  });

  describe('computeRoomieScore (via getMe)', () => {
    it('returns 30 for user with 1 photo, quizCompleted=true, onboardingStep=4 (phone not verified)', async () => {
      const mockUser = {
        id: 1,
        name: 'Test',
        birthDate: null,
        scenario: 'looking_housing_roomie' as const,
        budgetMin: null,
        budgetMax: null,
        smokingOk: false,
        petsOk: false,
        guestsPref: 'sometimes' as const,
        noiseLevel: null,
        cleanliness: null,
        sleepSchedule: null,
        socialLevel: null,
        workFromHome: null,
        roomieScore: 0,
        quizCompleted: true,
        onboardingStep: 4,
        isPhoneVerified: false,
        photos: [{ url: 'https://example.com/photo.jpg' }],
        vibeTags: [],
        districts: [],
      };

      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getMe(1);

      expect(result.roomieScore).toBe(30);
    });

    it('returns 0 for user with no photos, quizCompleted=false, onboardingStep=2', async () => {
      const mockUser = {
        id: 2,
        name: 'Empty',
        birthDate: null,
        scenario: 'looking_housing_roomie' as const,
        budgetMin: null,
        budgetMax: null,
        smokingOk: false,
        petsOk: false,
        guestsPref: 'sometimes' as const,
        noiseLevel: null,
        cleanliness: null,
        sleepSchedule: null,
        socialLevel: null,
        workFromHome: null,
        roomieScore: 0,
        quizCompleted: false,
        onboardingStep: 2,
        isPhoneVerified: false,
        photos: [],
        vibeTags: [],
        districts: [],
      };

      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getMe(2);

      expect(result.roomieScore).toBe(0);
    });
  });

  describe('getMe', () => {
    it('returns a profile object with roomieScore field', async () => {
      const mockUser = {
        id: 3,
        name: 'Alice',
        birthDate: new Date('2000-01-01'),
        scenario: 'has_housing_seeking_roomie' as const,
        budgetMin: 30000,
        budgetMax: 60000,
        smokingOk: false,
        petsOk: true,
        guestsPref: 'rarely' as const,
        noiseLevel: { toFixed: () => '0.30' } as unknown,
        cleanliness: { toFixed: () => '0.70' } as unknown,
        sleepSchedule: null,
        socialLevel: null,
        workFromHome: null,
        roomieScore: 20,
        quizCompleted: true,
        onboardingStep: 6,
        isPhoneVerified: false,
        photos: [{ url: 'https://cdn.example.com/alice.jpg' }],
        vibeTags: [
          { tag: { id: 1, label: 'Тихая' } },
        ],
        districts: [
          { district: { id: 5, name: 'Хамовники' } },
        ],
      };

      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getMe(3);

      expect(result).toHaveProperty('roomieScore');
      expect(typeof result.roomieScore).toBe('number');
      expect(result.id).toBe(3);
      expect(result.photos).toEqual(['https://cdn.example.com/alice.jpg']);
      expect(result.vibeTags).toEqual([{ id: 1, label: 'Тихая' }]);
      expect(result.districts).toEqual([{ id: 5, name: 'Хамовники' }]);
      expect(result.lifestyleScales).toBeDefined();
    });
  });
});
