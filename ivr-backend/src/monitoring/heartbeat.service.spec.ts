import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HeartbeatService } from './heartbeat.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExotelService } from '../exotel/exotel.service';

describe('HeartbeatService - ExoPhone Sync', () => {
  let service: HeartbeatService;
  let exotelService: ExotelService;

  const mockPrismaService = {
    healthCheck: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockExotelService = {
    checkExophoneHealth: jest.fn(),
    syncExoPhonesFromExotel: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config = {
        EXOTEL_HEARTBEAT_ENABLED: 'true',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeartbeatService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ExotelService,
          useValue: mockExotelService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HeartbeatService>(HeartbeatService);
    exotelService = module.get<ExotelService>(ExotelService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncExoPhonesScheduled', () => {
    const mockSyncResult = {
      success: true,
      totalFetched: 3,
      syncedToDb: 3,
      phones: [
        {
          id: 1,
          number: '+911234567890',
          friendlyName: 'Sales Line',
        },
        {
          id: 2,
          number: '+911234567891',
          friendlyName: 'Support Helpline',
        },
        {
          id: 3,
          number: '+911234567892',
          friendlyName: 'Billing Department',
        },
      ],
    };

    it('should sync ExoPhones successfully', async () => {
      mockExotelService.syncExoPhonesFromExotel.mockResolvedValue(mockSyncResult);

      await service.syncExoPhonesScheduled();

      expect(mockExotelService.syncExoPhonesFromExotel).toHaveBeenCalledTimes(1);
    });

    it('should log success message when sync completes', async () => {
      mockExotelService.syncExoPhonesFromExotel.mockResolvedValue(mockSyncResult);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.syncExoPhonesScheduled();

      expect(loggerSpy).toHaveBeenCalledWith('Running scheduled ExoPhone sync');
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scheduled ExoPhone sync completed: 3 phones updated'),
      );
    });

    it('should handle sync errors gracefully', async () => {
      const error = new Error('Exotel API is down');
      mockExotelService.syncExoPhonesFromExotel.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.syncExoPhonesScheduled();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scheduled ExoPhone sync failed: Exotel API is down'),
      );
    });

    it('should not crash when sync fails', async () => {
      mockExotelService.syncExoPhonesFromExotel.mockRejectedValue(new Error('Database error'));

      await expect(service.syncExoPhonesScheduled()).resolves.not.toThrow();
    });

    it('should sync even when no phones are returned', async () => {
      const emptyResult = {
        success: true,
        totalFetched: 0,
        syncedToDb: 0,
        phones: [],
      };
      mockExotelService.syncExoPhonesFromExotel.mockResolvedValue(emptyResult);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.syncExoPhonesScheduled();

      expect(mockExotelService.syncExoPhonesFromExotel).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scheduled ExoPhone sync completed: 0 phones updated'),
      );
    });

    it('should be defined as a method', () => {
      expect(service.syncExoPhonesScheduled).toBeDefined();
      expect(typeof service.syncExoPhonesScheduled).toBe('function');
    });
  });
});
