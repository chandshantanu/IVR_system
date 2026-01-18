import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExotelController } from './exotel.controller';
import { ExotelService } from './exotel.service';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard';

describe('ExotelController - ExoPhone Sync', () => {
  let controller: ExotelController;
  let service: ExotelService;

  const mockExotelService = {
    syncExoPhonesFromExotel: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        EXOTEL_API_KEY: 'test_api_key',
        EXOTEL_API_SECRET: 'test_api_secret',
        EXOTEL_SID: 'test_account_sid',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExotelController],
      providers: [
        {
          provide: ExotelService,
          useValue: mockExotelService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        WebhookSignatureGuard,
      ],
    }).compile();

    controller = module.get<ExotelController>(ExotelController);
    service = module.get<ExotelService>(ExotelService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/exotel/sync-exophones', () => {
    const mockSyncResult = {
      success: true,
      totalFetched: 3,
      syncedToDb: 3,
      phones: [
        {
          id: 1,
          number: '+911234567890',
          friendlyName: 'Sales Line',
          type: 'exophone',
          isActive: true,
          isPrimary: true,
          capabilities: {
            voice: true,
            sms: true,
            recording: true,
          },
          metadata: {
            exophoneSid: 'PN123456',
            voiceUrl: 'https://exotel.com/applet/123',
            smsUrl: 'https://exotel.com/sms/123',
            numberType: 'local',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          number: '+911234567891',
          friendlyName: 'Support Helpline',
          type: 'exophone',
          isActive: true,
          isPrimary: false,
          capabilities: {
            voice: true,
            sms: false,
            recording: true,
          },
          metadata: {
            exophoneSid: 'PN123457',
            voiceUrl: 'https://exotel.com/applet/124',
            smsUrl: null,
            numberType: 'local',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          number: '+911234567892',
          friendlyName: 'Billing Department',
          type: 'exophone',
          isActive: true,
          isPrimary: false,
          capabilities: {
            voice: true,
            sms: false,
            recording: true,
          },
          metadata: {
            exophoneSid: 'PN123458',
            voiceUrl: 'https://exotel.com/applet/125',
            smsUrl: null,
            numberType: 'toll-free',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should sync ExoPhones successfully', async () => {
      mockExotelService.syncExoPhonesFromExotel.mockResolvedValue(mockSyncResult);

      const result = await controller.syncExoPhones();

      expect(result).toBeDefined();
      expect(result.message).toBe('ExoPhones synced successfully');
      expect(result.success).toBe(true);
      expect(result.totalFetched).toBe(3);
      expect(result.syncedToDb).toBe(3);
      expect(result.phones).toHaveLength(3);
      expect(mockExotelService.syncExoPhonesFromExotel).toHaveBeenCalledTimes(1);
    });

    it('should return empty result when no ExoPhones found', async () => {
      const emptyResult = {
        success: true,
        totalFetched: 0,
        syncedToDb: 0,
        phones: [],
      };

      mockExotelService.syncExoPhonesFromExotel.mockResolvedValue(emptyResult);

      const result = await controller.syncExoPhones();

      expect(result.success).toBe(true);
      expect(result.totalFetched).toBe(0);
      expect(result.syncedToDb).toBe(0);
      expect(result.phones).toHaveLength(0);
    });

    it('should handle errors from service', async () => {
      const errorMessage = 'Failed to connect to Exotel API';
      mockExotelService.syncExoPhonesFromExotel.mockRejectedValue(new Error(errorMessage));

      await expect(controller.syncExoPhones()).rejects.toThrow(errorMessage);
      expect(mockExotelService.syncExoPhonesFromExotel).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      mockExotelService.syncExoPhonesFromExotel.mockRejectedValue(
        new Error('Exotel API authentication failed'),
      );

      await expect(controller.syncExoPhones()).rejects.toThrow('Exotel API authentication failed');
    });
  });
});
