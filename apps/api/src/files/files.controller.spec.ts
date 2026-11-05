import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { BadRequestException } from '@nestjs/common';
import { SharePermission, ShareScope, AccessRequestStatus } from '@prisma/client';

describe('FilesController', () => {
  let controller: FilesController;
  let service: jest.Mocked<FilesService>;

  const mockUser = {
    id: 'user-123',
    email: 'user@bcc.com',
    role: 'MEMBER',
  };

  const mockReq = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const mockFilesService = {
      getMyFiles: jest.fn(),
      getRecentFiles: jest.fn(),
      getSharedWithMe: jest.fn(),
      createFolder: jest.fn(),
      uploadFile: jest.fn(),
      getFileMetadata: jest.fn(),
      downloadFile: jest.fn(),
      renameItem: jest.fn(),
      moveItem: jest.fn(),
      deleteItem: jest.fn(),
      createShare: jest.fn(),
      getFileShares: jest.fn(),
      revokeShare: jest.fn(),
      getByShareToken: jest.fn(),
      getVersionHistory: jest.fn(),
      restoreVersion: jest.fn(),
      createAccessRequest: jest.fn(),
      getPendingRequestsForOwner: jest.fn(),
      reviewAccessRequest: jest.fn(),
      createAttachment: jest.fn(),
      getAttachment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get(FilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyFiles, getRecentFiles, getSharedWithMe', () => {
    it('calls getMyFiles with parentId', async () => {
      service.getMyFiles.mockResolvedValue({ items: [], breadcrumbs: [] });
      const res = await controller.getMyFiles(mockReq, 'folder-1');
      expect(service.getMyFiles).toHaveBeenCalledWith(mockUser.id, 'folder-1');
      expect(res).toEqual({ items: [], breadcrumbs: [] });
    });

    it('calls getRecentFiles', async () => {
      service.getRecentFiles.mockResolvedValue([]);
      const res = await controller.getRecentFiles(mockReq);
      expect(service.getRecentFiles).toHaveBeenCalledWith(mockUser.id);
      expect(res).toEqual([]);
    });

    it('calls getSharedWithMe', async () => {
      service.getSharedWithMe.mockResolvedValue([]);
      const res = await controller.getSharedWithMe(mockReq);
      expect(service.getSharedWithMe).toHaveBeenCalledWith(mockUser.id);
      expect(res).toEqual([]);
    });
  });

  describe('createFolder and uploadFile', () => {
    it('creates folder', async () => {
      service.createFolder.mockResolvedValue({ id: 'f-1', name: 'Docs' } as any);
      const res = await controller.createFolder(mockReq, { name: 'Docs', parentId: 'root' });
      expect(service.createFolder).toHaveBeenCalledWith(mockUser.id, 'Docs', 'root');
      expect(res.name).toBe('Docs');
    });

    it('throws if file is missing on upload', async () => {
      await expect(controller.uploadFile(mockReq, undefined)).rejects.toThrow(BadRequestException);
    });

    it('uploads file if provided', async () => {
      const mockFile = { originalname: 'file.txt', buffer: Buffer.from('hi'), mimetype: 'text/plain', size: 2 } as any;
      service.uploadFile.mockResolvedValue({ id: 'item-1', name: 'file.txt' } as any);
      const res = await controller.uploadFile(mockReq, mockFile, 'folder-1');
      expect(service.uploadFile).toHaveBeenCalledWith(mockUser.id, mockFile, 'folder-1');
      expect(res.id).toBe('item-1');
    });
  });

  describe('downloadFile and previewFile', () => {
    it('streams download with attachment disposition', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;
      service.downloadFile.mockResolvedValue({
        name: 'report.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('pdf-content'),
      });

      await controller.downloadFile('f-1', mockReq, mockRes);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="report.pdf"');
      expect(mockRes.send).toHaveBeenCalledWith(Buffer.from('pdf-content'));
    });

    it('streams preview with inline disposition', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;
      service.downloadFile.mockResolvedValue({
        name: 'image.png',
        mimeType: 'image/png',
        size: 2048,
        buffer: Buffer.from('img-content'),
      });

      await controller.previewFile('f-2', mockReq, mockRes);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="image.png"');
      expect(mockRes.send).toHaveBeenCalledWith(Buffer.from('img-content'));
    });
  });

  describe('rename, move, delete', () => {
    it('renames item', async () => {
      service.renameItem.mockResolvedValue({ id: 'item-1', name: 'New.txt' } as any);
      const res = await controller.renameItem('item-1', mockReq, { name: 'New.txt' });
      expect(service.renameItem).toHaveBeenCalledWith('item-1', mockUser.id, 'New.txt');
      expect(res.name).toBe('New.txt');
    });

    it('moves item', async () => {
      service.moveItem.mockResolvedValue({ id: 'item-1', parentId: 'target' } as any);
      const res = await controller.moveItem('item-1', mockReq, { targetParentId: 'target' });
      expect(service.moveItem).toHaveBeenCalledWith('item-1', mockUser.id, 'target');
      expect(res.parentId).toBe('target');
    });

    it('deletes item', async () => {
      service.deleteItem.mockResolvedValue({ success: true, deletedId: 'item-1' });
      const res = await controller.deleteItem('item-1', mockReq);
      expect(service.deleteItem).toHaveBeenCalledWith('item-1', mockUser.id);
      expect(res.success).toBe(true);
    });
  });

  describe('sharing D-004', () => {
    it('creates share', async () => {
      const dto = { permission: SharePermission.VIEW, scope: ShareScope.ORGANIZATION };
      service.createShare.mockResolvedValue({ id: 's-1', shareToken: 'tok-123' } as any);
      const res = await controller.createShare('item-1', mockReq, dto);
      expect(service.createShare).toHaveBeenCalledWith('item-1', mockUser.id, dto);
      expect(res.shareToken).toBe('tok-123');
    });

    it('revokes share', async () => {
      service.revokeShare.mockResolvedValue({ success: true, revokedId: 's-1' });
      const res = await controller.revokeShare('s-1', mockReq);
      expect(service.revokeShare).toHaveBeenCalledWith('s-1', mockUser.id);
      expect(res.success).toBe(true);
    });

    it('gets by share token', async () => {
      service.getByShareToken.mockResolvedValue({ file: { id: 'f-1' }, permission: SharePermission.VIEW } as any);
      const res = await controller.getByShareToken('tok-123');
      expect(service.getByShareToken).toHaveBeenCalledWith('tok-123');
      expect(res.permission).toBe(SharePermission.VIEW);
    });
  });

  describe('version history D-005', () => {
    it('gets version history', async () => {
      service.getVersionHistory.mockResolvedValue([{ versionNumber: 1 }] as any);
      const res = await controller.getVersionHistory('item-1', mockReq);
      expect(service.getVersionHistory).toHaveBeenCalledWith('item-1', mockUser.id);
      expect(res).toHaveLength(1);
    });

    it('restores version', async () => {
      service.restoreVersion.mockResolvedValue({ id: 'item-1', currentVersion: 1 } as any);
      const res = await controller.restoreVersion('item-1', '1', mockReq);
      expect(service.restoreVersion).toHaveBeenCalledWith('item-1', mockUser.id, 1);
      expect(res.currentVersion).toBe(1);
    });
  });

  describe('access requests D-009', () => {
    it('creates access request', async () => {
      const dto = { fileId: 'item-1', requestedPermission: SharePermission.VIEW, note: 'Need access' };
      service.createAccessRequest.mockResolvedValue({ id: 'req-1', status: AccessRequestStatus.PENDING } as any);
      const res = await controller.createAccessRequest(mockReq, dto);
      expect(service.createAccessRequest).toHaveBeenCalledWith(mockUser.id, dto);
      expect(res.id).toBe('req-1');
    });

    it('reviews access request', async () => {
      const dto = { status: AccessRequestStatus.APPROVED, grantedPermission: SharePermission.VIEW };
      service.reviewAccessRequest.mockResolvedValue({ id: 'req-1', status: AccessRequestStatus.APPROVED } as any);
      const res = await controller.reviewAccessRequest('req-1', mockReq, dto);
      expect(service.reviewAccessRequest).toHaveBeenCalledWith('req-1', mockUser.id, dto);
      expect(res.status).toBe(AccessRequestStatus.APPROVED);
    });
  });

  describe('attachments (C-011 shared)', () => {
    it('uploads attachment', async () => {
      const mockFile = { originalname: 'doc.pdf', buffer: Buffer.from('data'), mimetype: 'application/pdf', size: 4 } as any;
      service.createAttachment.mockResolvedValue({ id: 'att-1', fileName: 'doc.pdf' } as any);
      const res = await controller.uploadAttachment(mockReq, mockFile, 'file-1');
      expect(service.createAttachment).toHaveBeenCalledWith(mockUser.id, mockFile, 'file-1');
      expect(res.id).toBe('att-1');
    });

    it('gets attachment stream', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;
      service.getAttachment.mockResolvedValue({
        attachment: { fileName: 'att.txt', mimeType: 'text/plain' } as any,
        buffer: Buffer.from('att-data'),
      });
      await controller.getAttachment('att-1', mockRes);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockRes.send).toHaveBeenCalledWith(Buffer.from('att-data'));
    });
  });
});
