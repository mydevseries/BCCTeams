import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully and return tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@bccteams.local',
        displayName: 'Test User',
        avatarUrl: null,
        jobTitle: null,
        department: null,
        phoneNumber: null,
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.register({
        email: 'test@bccteams.local',
        password: 'Password123!',
        displayName: 'Test User',
      });

      expect(result.user.email).toBe('test@bccteams.local');
      expect(result.user.displayName).toBe('Test User');
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw ConflictException if email already registered', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@bccteams.local',
      });

      await expect(
        service.register({
          email: 'existing@bccteams.local',
          password: 'Password123!',
          displayName: 'Test User',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should authenticate user and return tokens when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@bccteams.local',
        passwordHash,
        displayName: 'Test User',
        role: 'MEMBER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.login({
        email: 'test@bccteams.local',
        password: 'CorrectPassword123!',
      });

      expect(result.user.id).toBe('user-1');
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@bccteams.local',
        passwordHash,
        isActive: true,
      });

      await expect(
        service.login({
          email: 'test@bccteams.local',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
