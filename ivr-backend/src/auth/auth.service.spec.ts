import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    validatePassword: jest.fn(),
    updateLastLogin: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      role: 'agent',
      isActive: true,
      fullName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return user data without password for valid credentials', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toBeDefined();
      expect(result.passwordHash).toBeUndefined();
      expect(result.username).toBe('testuser');
    });

    it('should return null for invalid username', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUsersService.findByUsername.mockResolvedValue(inactiveUser);

      await expect(service.validateUser('testuser', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'agent',
      fullName: 'Test User',
    };

    it('should return access and refresh tokens on successful login', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockJwtService.sign.mockReturnValue('mock.jwt.token');
      mockConfigService.get.mockReturnValue('refresh_secret');

      const result = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe('testuser');
      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ username: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      fullName: 'New User',
      role: 'agent',
    };

    const createdUser = {
      id: 2,
      username: 'newuser',
      email: 'new@example.com',
      role: 'agent',
      fullName: 'New User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should register a new user and return tokens', async () => {
      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('mock.jwt.token');
      mockConfigService.get.mockReturnValue('refresh_secret');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe('newuser');
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('refreshToken', () => {
    const mockPayload = {
      sub: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'agent',
    };

    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'agent',
      fullName: 'Test User',
    };

    it('should return new access token for valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new.access.token');
      mockConfigService.get.mockReturnValue('refresh_secret');

      const result = await service.refreshToken('valid.refresh.token');

      expect(result).toHaveProperty('accessToken', 'new.access.token');
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid.refresh.token', {
        secret: 'refresh_secret',
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      mockConfigService.get.mockReturnValue('refresh_secret');

      await expect(service.refreshToken('invalid.refresh.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
