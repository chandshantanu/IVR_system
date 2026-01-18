import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return basic health status', () => {
      const result = service.getHealth();
      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.message).toBe('IVR Backend Service is running');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health information', () => {
      const result = service.getDetailedHealth();
      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.version).toBe('1.0.0');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.memory).toBeDefined();
      expect(result.memory.used).toContain('MB');
    });
  });
});
