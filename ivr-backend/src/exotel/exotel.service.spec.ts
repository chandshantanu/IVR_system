import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExotelService } from './exotel.service';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ExotelService - ExoPhone Sync', () => {
  let service: ExotelService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        EXOTEL_API_KEY: 'test_api_key',
        EXOTEL_API_SECRET: 'test_api_secret',
        EXOTEL_SID: 'test_account_sid',
        EXOTEL_FROM_NUMBER: '+911234567890',
        EXOTEL_CALLER_ID: '+911234567890',
        EXOTEL_BASE_URL: 'https://api.in.exotel.com',
        NGROK_URL: 'http://localhost:3001',
      };
      return config[key];
    }),
  };

  const mockPrismaService = {
    phoneNumber: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockHttpClient = {
    get: jest.fn(),
    post: jest.fn(),
    defaults: {
      timeout: 30000,
      maxRedirects: 5,
      headers: {},
    },
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock axios.create to return our mock http client
    mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExotelService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExotelService>(ExotelService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncExoPhonesFromExotel', () => {
    const mockExoPhones = [
      {
        sid: 'PN123456',
        phone_number: '+911234567890',
        friendly_name: 'Sales Line',
        voice_url: 'https://exotel.com/applet/123',
        sms_url: 'https://exotel.com/sms/123',
        number_type: 'local',
        capabilities: {
          voice: true,
          sms: true,
        },
      },
      {
        sid: 'PN123457',
        phone_number: '+911234567891',
        friendly_name: 'Support Helpline',
        voice_url: 'https://exotel.com/applet/124',
        sms_url: 'https://exotel.com/sms/124',
        number_type: 'local',
        capabilities: {
          voice: true,
          sms: false,
        },
      },
      {
        sid: 'PN123458',
        phone_number: '+911234567892',
        friendly_name: 'Billing Department',
        voice_url: 'https://exotel.com/applet/125',
        sms_url: null,
        number_type: 'toll-free',
        capabilities: {
          voice: true,
          sms: false,
        },
      },
    ];

    const mockDbPhoneNumber = {
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
    };

    it('should fetch ExoPhones from Exotel API successfully', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          incoming_phone_numbers: mockExoPhones,
        },
      });

      mockPrismaService.phoneNumber.upsert.mockResolvedValue(mockDbPhoneNumber);

      const result = await service.syncExoPhonesFromExotel();

      expect(result.success).toBe(true);
      expect(result.totalFetched).toBe(3);
      expect(result.syncedToDb).toBe(3);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://api.in.exotel.com/v2_beta/Accounts/test_account_sid/IncomingPhoneNumbers',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should upsert phone numbers with correct data structure', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          incoming_phone_numbers: [mockExoPhones[0]],
        },
      });

      mockPrismaService.phoneNumber.upsert.mockResolvedValue(mockDbPhoneNumber);

      await service.syncExoPhonesFromExotel();

      expect(mockPrismaService.phoneNumber.upsert).toHaveBeenCalledWith({
        where: { number: '+911234567890' },
        create: expect.objectContaining({
          number: '+911234567890',
          friendlyName: 'Sales Line',
          type: 'exophone',
          isActive: true,
          isPrimary: true,
          capabilities: expect.objectContaining({
            voice: true,
            sms: true,
            recording: true,
          }),
          metadata: expect.objectContaining({
            exophoneSid: 'PN123456',
            voiceUrl: 'https://exotel.com/applet/123',
            smsUrl: 'https://exotel.com/sms/123',
            numberType: 'local',
          }),
        }),
        update: expect.objectContaining({
          friendlyName: 'Sales Line',
          metadata: expect.objectContaining({
            exophoneSid: 'PN123456',
            voiceUrl: 'https://exotel.com/applet/123',
          }),
        }),
      });
    });

    it('should handle ExoPhones without friendly names', async () => {
      const exophoneWithoutName = {
        ...mockExoPhones[0],
        friendly_name: null,
      };

      mockHttpClient.get.mockResolvedValue({
        data: {
          incoming_phone_numbers: [exophoneWithoutName],
        },
      });

      mockPrismaService.phoneNumber.upsert.mockResolvedValue(mockDbPhoneNumber);

      await service.syncExoPhonesFromExotel();

      expect(mockPrismaService.phoneNumber.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { number: '+911234567890' },
          create: expect.objectContaining({
            friendlyName: 'ExoPhone +911234567890',
          }),
        }),
      );
    });

    it('should set isPrimary=true only for first ExoPhone', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          incoming_phone_numbers: mockExoPhones,
        },
      });

      mockPrismaService.phoneNumber.upsert.mockResolvedValue(mockDbPhoneNumber);

      await service.syncExoPhonesFromExotel();

      // First call should have isPrimary: true
      expect(mockPrismaService.phoneNumber.upsert.mock.calls[0][0].create.isPrimary).toBe(true);

      // Subsequent calls should have isPrimary: false
      expect(mockPrismaService.phoneNumber.upsert.mock.calls[1][0].create.isPrimary).toBe(false);
      expect(mockPrismaService.phoneNumber.upsert.mock.calls[2][0].create.isPrimary).toBe(false);
    });

    it('should handle empty ExoPhones list', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          incoming_phone_numbers: [],
        },
      });

      const result = await service.syncExoPhonesFromExotel();

      expect(result.success).toBe(true);
      expect(result.totalFetched).toBe(0);
      expect(result.syncedToDb).toBe(0);
      expect(mockPrismaService.phoneNumber.upsert).not.toHaveBeenCalled();
    });

    it('should handle Exotel API errors gracefully', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Exotel API is down'));

      await expect(service.syncExoPhonesFromExotel()).rejects.toThrow('Exotel API is down');
    });

    it('should handle database errors gracefully', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          incoming_phone_numbers: [mockExoPhones[0]],
        },
      });

      mockPrismaService.phoneNumber.upsert.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.syncExoPhonesFromExotel()).rejects.toThrow('Database connection failed');
    });

    it('should handle missing capabilities field', async () => {
      const exophoneWithoutCapabilities = {
        ...mockExoPhones[0],
        capabilities: undefined,
      };

      mockHttpClient.get.mockResolvedValue({
        data: {
          incoming_phone_numbers: [exophoneWithoutCapabilities],
        },
      });

      mockPrismaService.phoneNumber.upsert.mockResolvedValue(mockDbPhoneNumber);

      await service.syncExoPhonesFromExotel();

      expect(mockPrismaService.phoneNumber.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            capabilities: expect.objectContaining({
              voice: true,
              sms: true,
              recording: true,
            }),
          }),
        }),
      );
    });

    it('should return synced phone numbers in response', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          incoming_phone_numbers: mockExoPhones,
        },
      });

      mockPrismaService.phoneNumber.upsert.mockResolvedValue(mockDbPhoneNumber);

      const result = await service.syncExoPhonesFromExotel();

      expect(result.phones).toHaveLength(3);
      expect(result.phones[0]).toEqual(mockDbPhoneNumber);
    });

    it('should use correct authentication header', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          incoming_phone_numbers: [],
        },
      });

      await service.syncExoPhonesFromExotel();

      const expectedAuth = Buffer.from('test_api_key:test_api_secret').toString('base64');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${expectedAuth}`,
          }),
        }),
      );
    });
  });
});
