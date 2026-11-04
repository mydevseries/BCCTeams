import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: any;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'sarah.connor@bccteams.local',
    displayName: 'Sarah Connor',
    avatarUrl: null,
    jobTitle: 'Senior Security Architect',
    department: 'Engineering',
    phoneNumber: '+1-555-0199',
    role: 'MEMBER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    presence: {
      status: 'AVAILABLE',
      statusMessage: 'Ready to collaborate',
    },
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getMe', () => {
    it('returns sanitized profile for active user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe('user-uuid-1');
      expect(result.id).toBe(mockUser.id);
      expect(result.displayName).toBe('Sarah Connor');
      expect(result.email).toBe(mockUser.email);
    });

    it('throws NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates name, job title, department and phone number', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const updatedMock = {
        ...mockUser,
        displayName: 'Sarah Connor-Reese',
        jobTitle: 'Director of Security',
        department: 'InfoSec',
        phoneNumber: '+1-555-0200',
      };
      mockPrisma.user.update.mockResolvedValue(updatedMock);

      const result = await service.updateProfile('user-uuid-1', {
        displayName: 'Sarah Connor-Reese',
        jobTitle: 'Director of Security',
        department: 'InfoSec',
        phoneNumber: '+1-555-0200',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: {
          displayName: 'Sarah Connor-Reese',
          jobTitle: 'Director of Security',
          department: 'InfoSec',
          phoneNumber: '+1-555-0200',
        },
      });
      expect(result.displayName).toBe('Sarah Connor-Reese');
      expect(result.jobTitle).toBe('Director of Security');
    });
  });

  describe('updateAvatar', () => {
    it('saves valid PNG image and updates avatarUrl', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockImplementation((args: any) => ({
        ...mockUser,
        avatarUrl: args.data.avatarUrl,
      }));

      const fakePngBuffer = Buffer.from('fake-png-content');
      const result = await service.updateAvatar('user-uuid-1', fakePngBuffer, 'image/png');

      expect(result.avatarUrl).toContain('/uploads/avatars/user-uuid-1-');
      expect(result.avatarUrl).toMatch(/\.png$/);
    });

    it('rejects disallowed file mime types', async () => {
      const fakeExeBuffer = Buffer.from('fake-executable');
      await expect(
        service.updateAvatar('user-uuid-1', fakeExeBuffer, 'application/x-msdownload')
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects files exceeding 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
      await expect(
        service.updateAvatar('user-uuid-1', largeBuffer, 'image/png')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeAvatar', () => {
    it('clears avatarUrl back to null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        avatarUrl: '/uploads/avatars/user-uuid-1-1234.png',
      });
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        avatarUrl: null,
      });

      const result = await service.removeAvatar('user-uuid-1');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { avatarUrl: null },
      });
      expect(result.avatarUrl).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('returns public member card with presence and local time', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserProfile('user-uuid-1');
      expect(result.id).toBe(mockUser.id);
      expect(result.displayName).toBe('Sarah Connor');
      expect(result.presence?.status).toBe('AVAILABLE');
      expect(result.localTime).toBeDefined();
    });
  });
});
