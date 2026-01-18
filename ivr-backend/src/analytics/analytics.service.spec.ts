import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService - Phone Number Mapping', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    phoneNumber: {
      findMany: jest.fn(),
    },
    voiceCallback: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    agent: {
      count: jest.fn(),
    },
    callQueueEntry: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCallHistory with phone number friendly names', () => {
    const mockPhoneNumbers = [
      {
        number: '+911234567890',
        friendlyName: 'Sales Line',
      },
      {
        number: '+911234567891',
        friendlyName: 'Support Helpline',
      },
      {
        number: '+911234567892',
        friendlyName: 'Billing Department',
      },
    ];

    const mockCalls = [
      {
        id: 1,
        callSid: 'CA123456',
        fromNumber: '+919876543210',
        toNumber: '+911234567890', // Sales Line
        status: 'completed',
        startTime: '2024-01-19T10:00:00Z',
        endTime: '2024-01-19T10:05:00Z',
        duration: '300',
        direction: 'inbound',
        recordingUrl: 'https://recording.com/123',
        answeredBy: 'human',
        createdAt: new Date('2024-01-19T10:00:00Z'),
        dateCreated: '2024-01-19T10:00:00Z',
      },
      {
        id: 2,
        callSid: 'CA123457',
        fromNumber: '+919876543211',
        toNumber: '+911234567891', // Support Helpline
        status: 'completed',
        startTime: '2024-01-19T10:10:00Z',
        endTime: '2024-01-19T10:15:00Z',
        duration: '300',
        direction: 'inbound',
        recordingUrl: 'https://recording.com/124',
        answeredBy: 'human',
        createdAt: new Date('2024-01-19T10:10:00Z'),
        dateCreated: '2024-01-19T10:10:00Z',
      },
      {
        id: 3,
        callSid: 'CA123458',
        fromNumber: '+919876543212',
        toNumber: '+911234567892', // Billing Department
        status: 'completed',
        startTime: '2024-01-19T10:20:00Z',
        endTime: '2024-01-19T10:25:00Z',
        duration: '300',
        direction: 'inbound',
        recordingUrl: 'https://recording.com/125',
        answeredBy: 'human',
        createdAt: new Date('2024-01-19T10:20:00Z'),
        dateCreated: '2024-01-19T10:20:00Z',
      },
      {
        id: 4,
        callSid: 'CA123459',
        fromNumber: '+911234567890',
        toNumber: '+919999999999', // Unknown number
        status: 'completed',
        startTime: '2024-01-19T10:30:00Z',
        endTime: '2024-01-19T10:35:00Z',
        duration: '300',
        direction: 'outbound',
        recordingUrl: null,
        answeredBy: 'human',
        createdAt: new Date('2024-01-19T10:30:00Z'),
        dateCreated: '2024-01-19T10:30:00Z',
      },
    ];

    it('should map inbound calls to phone number friendly names', async () => {
      mockPrismaService.phoneNumber.findMany.mockResolvedValue(mockPhoneNumbers);
      mockPrismaService.voiceCallback.findMany.mockResolvedValue([mockCalls[0], mockCalls[1], mockCalls[2]]);
      mockPrismaService.voiceCallback.count.mockResolvedValue(3);

      const result = await service.getCallHistory({});

      expect(result.calls).toHaveLength(3);
      expect(result.calls[0].flow.name).toBe('Sales Line');
      expect(result.calls[1].flow.name).toBe('Support Helpline');
      expect(result.calls[2].flow.name).toBe('Billing Department');
      expect(mockPrismaService.phoneNumber.findMany).toHaveBeenCalledWith({
        select: {
          number: true,
          friendlyName: true,
        },
      });
    });

    it('should show "Unknown Department" for unmapped numbers', async () => {
      mockPrismaService.phoneNumber.findMany.mockResolvedValue(mockPhoneNumbers);
      mockPrismaService.voiceCallback.findMany.mockResolvedValue([mockCalls[3]]);
      mockPrismaService.voiceCallback.count.mockResolvedValue(1);

      const result = await service.getCallHistory({});

      expect(result.calls).toHaveLength(1);
      expect(result.calls[0].flow.name).toBe('Unknown Department');
      expect(result.calls[0].direction).toBe('outbound');
    });

    it('should handle empty phone numbers list', async () => {
      mockPrismaService.phoneNumber.findMany.mockResolvedValue([]);
      mockPrismaService.voiceCallback.findMany.mockResolvedValue([mockCalls[0]]);
      mockPrismaService.voiceCallback.count.mockResolvedValue(1);

      const result = await service.getCallHistory({});

      expect(result.calls).toHaveLength(1);
      expect(result.calls[0].flow.name).toBe('Unknown Department');
    });

    it('should preserve other call properties', async () => {
      mockPrismaService.phoneNumber.findMany.mockResolvedValue(mockPhoneNumbers);
      mockPrismaService.voiceCallback.findMany.mockResolvedValue([mockCalls[0]]);
      mockPrismaService.voiceCallback.count.mockResolvedValue(1);

      const result = await service.getCallHistory({});

      expect(result.calls[0]).toMatchObject({
        id: 1,
        callSid: 'CA123456',
        callerNumber: '+919876543210',
        calledNumber: '+911234567890',
        status: expect.any(String),
        durationSeconds: 300,
        recordingUrl: 'https://recording.com/123',
        direction: 'inbound',
        answeredBy: 'human',
      });
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.phoneNumber.findMany.mockResolvedValue(mockPhoneNumbers);
      mockPrismaService.voiceCallback.findMany.mockResolvedValue([mockCalls[1]]);
      mockPrismaService.voiceCallback.count.mockResolvedValue(100);

      const result = await service.getCallHistory({ limit: 50, offset: 50 });

      expect(result.total).toBe(100);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(50);
    });

    it('should apply filters correctly', async () => {
      const startDate = new Date('2024-01-19T00:00:00Z');
      const endDate = new Date('2024-01-19T23:59:59Z');

      mockPrismaService.phoneNumber.findMany.mockResolvedValue(mockPhoneNumbers);
      mockPrismaService.voiceCallback.findMany.mockResolvedValue([mockCalls[0]]);
      mockPrismaService.voiceCallback.count.mockResolvedValue(1);

      await service.getCallHistory({
        startDate,
        endDate,
        status: 'completed',
        callerNumber: '+9198765',
      });

      expect(mockPrismaService.voiceCallback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'completed',
            fromNumber: { contains: '+9198765' },
          }),
        }),
      );
    });

    it('should use phone number friendly name for inbound calls to mapped numbers', async () => {
      mockPrismaService.phoneNumber.findMany.mockResolvedValue([
        { number: '+911234567890', friendlyName: 'Customer Service' },
      ]);
      mockPrismaService.voiceCallback.findMany.mockResolvedValue([mockCalls[0]]);
      mockPrismaService.voiceCallback.count.mockResolvedValue(1);

      const result = await service.getCallHistory({});

      expect(result.calls[0].flow.name).toBe('Customer Service');
      expect(result.calls[0].direction).toBe('inbound');
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.phoneNumber.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getCallHistory({})).rejects.toThrow('Database error');
    });
  });
});
