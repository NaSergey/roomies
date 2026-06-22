import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SwipeActionDto } from './dto/create-swipe.dto';
import { SwipeService } from './swipe.service';

describe('SwipeService', () => {
  let service: SwipeService;
  let mockTx: {
    swipe: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
    };
    match: {
      upsert: jest.Mock;
    };
  };
  let mockPrisma: {
    swipe: { findUnique: jest.Mock; create: jest.Mock; findFirst: jest.Mock };
    match: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    mockTx = {
      swipe: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      match: {
        upsert: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };

    mockPrisma = {
      swipe: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      match: {
        upsert: jest.fn().mockResolvedValue({ id: 1 }),
      },
      $transaction: jest.fn().mockImplementation(async (fn) => fn(mockTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwipeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SwipeService>(SwipeService);
  });

  describe('createSwipe', () => {
    it('throws BadRequestException when swiping yourself', async () => {
      await expect(
        service.createSwipe(1, { targetId: 1, action: SwipeActionDto.like }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when already swiped', async () => {
      mockTx.swipe.findUnique.mockResolvedValue({ id: 1 });
      await expect(
        service.createSwipe(1, { targetId: 2, action: SwipeActionDto.like }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns matched: false for a pass action', async () => {
      const result = await service.createSwipe(1, {
        targetId: 2,
        action: SwipeActionDto.pass,
      });
      expect(result).toEqual({ matched: false });
      expect(mockTx.swipe.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'pass' }) }),
      );
    });

    it('stores action=save without creating a Match', async () => {
      const result = await service.createSwipe(1, {
        targetId: 2,
        action: SwipeActionDto.save,
      });
      // save does not trigger match logic
      expect(result).toEqual({ matched: false });
      expect(mockTx.swipe.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'save' }) }),
      );
      // match.upsert should NOT be called for save
      expect(mockTx.match.upsert).not.toHaveBeenCalled();
    });

    it('creates a Match when mutual like exists', async () => {
      mockTx.swipe.findFirst.mockResolvedValue({ id: 99 });
      const result = await service.createSwipe(1, {
        targetId: 2,
        action: SwipeActionDto.like,
      });
      expect(result).toEqual({ matched: true, matchId: 1 });
      expect(mockTx.match.upsert).toHaveBeenCalled();
    });
  });
});
