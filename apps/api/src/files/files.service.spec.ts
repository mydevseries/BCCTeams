import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE_TOKEN } from '../storage/storage.interface';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: any;
  let storage: any;

  beforeEach(async () => {
    prisma = {
      fileItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      fileVersion: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      fileShare: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      fileAccessRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      attachment: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    storage = {
      upload: jest.fn().mockResolvedValue({ storageKey: 'test-key', size: 100, mimeType: 'text/plain' }),
      download: jest.fn().mockResolvedValue(Buffer.from('test-content')),
      delete: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: STORAGE_SERVICE_TOKEN, useValue: storage },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  describe('D-001: Views (My Files, Recent, Shared with me)', () => {
    it('returns user files and folders in root', async () => {
      prisma.fileItem.findMany.mockResolvedValue([
        {
          id: 'folder-1',
          name: 'Documents',
          size: BigInt(0),
          mimeType: 'application/vnd.bccteams.folder',
          isFolder: true,
          ownerId: 'u1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await service.getMyFiles('u1');
      expect(res.items).toHaveLength(1);
      expect(res.items[0].isFolder).toBe(true);
      expect(res.breadcrumbs).toEqual([]);
    });

    it('returns recent files within 30 days', async () => {
      prisma.fileItem.findMany.mockResolvedValue([
        {
          id: 'file-1',
          name: 'report.pdf',
          size: BigInt(1024),
          mimeType: 'application/pdf',
          isFolder: false,
          ownerId: 'u1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await service.getRecentFiles('u1');
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('report.pdf');
    });

    it('returns files shared with user', async () => {
      prisma.fileShare.findMany.mockResolvedValue([
        {
          id: 'share-1',
          permission: 'VIEW',
          scope: 'SPECIFIC_PEOPLE',
          createdAt: new Date(),
          file: {
            id: 'file-2',
            name: 'design.png',
            size: BigInt(2048),
            mimeType: 'image/png',
            isFolder: false,
            ownerId: 'u2',
            createdAt: new Date(),
            updatedAt: new Date(),
            owner: { id: 'u2', displayName: 'Designer', email: 'd@bcc.com' },
          },
        },
      ]);

      const res = await service.getSharedWithMe('u1');
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('design.png');
      expect(res[0].sharePermission).toBe('VIEW');
    });
  });

  describe('D-002: Folders & File Operations', () => {
    it('creates a new folder', async () => {
      prisma.fileItem.create.mockResolvedValue({
        id: 'f1',
        name: 'Project Alpha',
        isFolder: true,
        size: BigInt(0),
        mimeType: 'application/vnd.bccteams.folder',
        ownerId: 'u1',
        parentId: null,
      });

      const res = await service.createFolder('u1', 'Project Alpha');
      expect(res.name).toBe('Project Alpha');
      expect(res.isFolder).toBe(true);
    });

    it('uploads a new file, saving bytes to storage and creating v1', async () => {
      prisma.fileItem.findFirst.mockResolvedValue(null);
      prisma.fileItem.create.mockResolvedValue({
        id: 'file-new',
        name: 'spec.txt',
        size: BigInt(12),
        mimeType: 'text/plain',
        isFolder: false,
        ownerId: 'u1',
        currentVersion: 1,
      });

      const mockMulterFile = {
        originalname: 'spec.txt',
        buffer: Buffer.from('hello world!'),
        mimetype: 'text/plain',
        size: 12,
      } as Express.Multer.File;

      const res = await service.uploadFile('u1', mockMulterFile);
      expect(storage.upload).toHaveBeenCalled();
      expect(res.currentVersion).toBe(1);
    });

    it('downloads file bytes from storage', async () => {
      prisma.fileItem.findUnique.mockResolvedValue({
        id: 'file-1',
        name: 'spec.txt',
        mimeType: 'text/plain',
        size: BigInt(12),
        ownerId: 'u1',
        storageKey: 'key-123',
        isDeleted: false,
      });

      const res = await service.downloadFile('file-1', 'u1');
      expect(storage.download).toHaveBeenCalledWith('key-123');
      expect(res.name).toBe('spec.txt');
      expect(res.buffer).toBeInstanceOf(Buffer);
    });

    it('renames an item', async () => {
      prisma.fileItem.findUnique.mockResolvedValue({
        id: 'file-1',
        ownerId: 'u1',
        isDeleted: false,
      });
      prisma.fileItem.update.mockResolvedValue({
        id: 'file-1',
        name: 'new-spec.txt',
        extension: 'txt',
        size: BigInt(12),
      });

      const res = await service.renameItem('file-1', 'u1', 'new-spec.txt');
      expect(res.name).toBe('new-spec.txt');
    });

    it('moves an item to a target folder', async () => {
      prisma.fileItem.findUnique
        .mockResolvedValueOnce({ id: 'file-1', ownerId: 'u1', isDeleted: false })
        .mockResolvedValueOnce({ id: 'target-folder', isFolder: true, ownerId: 'u1', isDeleted: false })
        .mockResolvedValueOnce({ id: 'target-folder', ownerId: 'u1', isDeleted: false });

      prisma.fileItem.update.mockResolvedValue({
        id: 'file-1',
        name: 'spec.txt',
        parentId: 'target-folder',
        size: BigInt(12),
      });

      const res = await service.moveItem('file-1', 'u1', 'target-folder');
      expect(res.parentId).toBe('target-folder');
    });

    it('deletes an item and removes bytes from storage', async () => {
      prisma.fileItem.findUnique.mockResolvedValue({
        id: 'file-1',
        ownerId: 'u1',
        isFolder: false,
        storageKey: 'key-1',
        isDeleted: false,
        children: [],
      });

      const res = await service.deleteItem('file-1', 'u1');
      expect(storage.delete).toHaveBeenCalledWith('key-1');
      expect(prisma.fileItem.delete).toHaveBeenCalledWith({ where: { id: 'file-1' } });
      expect(res.success).toBe(true);
    });
  });

  describe('D-004: Sharing Links & Permissions', () => {
    it('creates a secure sharing link token', async () => {
      prisma.fileItem.findUnique.mockResolvedValue({ id: 'f1', ownerId: 'u1', isDeleted: false });
      prisma.fileShare.create.mockResolvedValue({
        id: 's1',
        fileId: 'f1',
        shareToken: 'abc123token',
        permission: 'VIEW',
        scope: 'ANYONE_WITH_LINK',
      });

      const res = await service.createShare('f1', 'u1', {
        permission: 'VIEW',
        scope: 'ANYONE_WITH_LINK',
      });
      expect(res.shareToken).toBe('abc123token');
    });

    it('resolves valid share link token', async () => {
      prisma.fileShare.findUnique.mockResolvedValue({
        shareToken: 'valid-token',
        permission: 'VIEW',
        scope: 'ANYONE_WITH_LINK',
        expiresAt: null,
        file: {
          id: 'f1',
          name: 'presentation.pdf',
          size: BigInt(500),
          isDeleted: false,
        },
      });

      const res = await service.getByShareToken('valid-token');
      expect(res.file.name).toBe('presentation.pdf');
      expect(res.permission).toBe('VIEW');
    });
  });

  describe('D-005: Version History & Restore', () => {
    it('increments version number and creates FileVersion on duplicate file upload', async () => {
      prisma.fileItem.findFirst.mockResolvedValue({
        id: 'f1',
        name: 'budget.xlsx',
        currentVersion: 1,
        ownerId: 'u1',
        parentId: null,
        isFolder: false,
        isDeleted: false,
      });

      prisma.fileItem.update.mockResolvedValue({
        id: 'f1',
        name: 'budget.xlsx',
        currentVersion: 2,
        size: BigInt(50),
      });

      const file = {
        originalname: 'budget.xlsx',
        buffer: Buffer.from('version 2 data'),
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 50,
      } as Express.Multer.File;

      const res = await service.uploadFile('u1', file);
      expect(prisma.fileVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileId: 'f1',
            versionNumber: 2,
          }),
        })
      );
      expect(res.currentVersion).toBe(2);
    });

    it('restores historical version to active version', async () => {
      prisma.fileItem.findUnique.mockResolvedValue({ id: 'f1', ownerId: 'u1', isDeleted: false });
      prisma.fileVersion.findUnique.mockResolvedValue({
        id: 'v1',
        fileId: 'f1',
        versionNumber: 1,
        storageKey: 'old-key',
        size: BigInt(30),
      });
      prisma.fileItem.update.mockResolvedValue({
        id: 'f1',
        currentVersion: 1,
        storageKey: 'old-key',
        size: BigInt(30),
      });

      const res = await service.restoreVersion('f1', 'u1', 1);
      expect(res.currentVersion).toBe(1);
    });
  });

  describe('D-009: File Access Requests', () => {
    it('creates a pending access request for restricted file', async () => {
      prisma.fileItem.findUnique.mockResolvedValue({ id: 'f-secret', ownerId: 'owner-1', isDeleted: false });
      prisma.fileAccessRequest.findFirst.mockResolvedValue(null);
      prisma.fileAccessRequest.create.mockResolvedValue({
        id: 'req-1',
        fileId: 'f-secret',
        requesterId: 'requester-1',
        status: 'PENDING',
        requestedPermission: 'VIEW',
      });

      const res = await service.createAccessRequest('requester-1', {
        fileId: 'f-secret',
        requestedPermission: 'VIEW',
      });
      expect(res.status).toBe('PENDING');
    });

    it('approving access request updates status and creates FileShare', async () => {
      prisma.fileAccessRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        fileId: 'f-secret',
        requesterId: 'requester-1',
        requestedPermission: 'VIEW',
        file: { ownerId: 'owner-1' },
      });
      prisma.fileAccessRequest.update.mockResolvedValue({
        id: 'req-1',
        status: 'APPROVED',
      });

      const res = await service.reviewAccessRequest('req-1', 'owner-1', {
        status: 'APPROVED',
        grantedPermission: 'VIEW',
      });
      expect(res.status).toBe('APPROVED');
      expect(prisma.fileShare.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileId: 'f-secret',
            sharedWithUserId: 'requester-1',
            permission: 'VIEW',
          }),
        })
      );
    });
  });

  describe('Generic Attachment API', () => {
    it('creates an attachment and saves bytes', async () => {
      prisma.attachment.create.mockResolvedValue({
        id: 'att-1',
        fileName: 'clip.mp4',
        fileSize: BigInt(1000),
        mimeType: 'video/mp4',
        storageKey: 'attachments/u1/clip.mp4',
        uploaderId: 'u1',
        createdAt: new Date(),
      });

      const mockFile = {
        originalname: 'clip.mp4',
        buffer: Buffer.from('video-data'),
        mimetype: 'video/mp4',
        size: 1000,
      } as Express.Multer.File;

      const res = await service.createAttachment('u1', mockFile);
      expect(storage.upload).toHaveBeenCalled();
      expect(res.fileName).toBe('clip.mp4');
      expect(res.fileSize).toBe(1000);
    });
  });
});
