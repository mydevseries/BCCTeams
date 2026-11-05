import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { SharePermission, ShareScope, AccessRequestStatus } from '@prisma/client';

describe('Files Module HTTP Integration', () => {
  let app: INestApplication;
  let filesService: jest.Mocked<FilesService>;

  const mockUser = {
    id: 'user-e2e-1',
    email: 'test@bcc.com',
    role: 'MEMBER',
  };

  beforeAll(async () => {
    const mockService = {
      getMyFiles: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'file-1',
            name: 'Report.pdf',
            size: 1024,
            mimeType: 'application/pdf',
            isFolder: false,
            ownerId: 'user-e2e-1',
            currentVersion: 1,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        breadcrumbs: [{ id: null, name: 'My files' }],
      }),
      getRecentFiles: jest.fn().mockResolvedValue([]),
      getSharedWithMe: jest.fn().mockResolvedValue([]),
      createFolder: jest.fn().mockImplementation((userId, name, parentId) => ({
        id: 'folder-new',
        name,
        isFolder: true,
        ownerId: userId,
        parentId: parentId || null,
        currentVersion: 1,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      uploadFile: jest.fn().mockImplementation((userId, file, parentId) => ({
        id: 'file-uploaded-1',
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        isFolder: false,
        ownerId: userId,
        parentId: parentId || null,
        currentVersion: 1,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      getFileMetadata: jest.fn().mockResolvedValue({
        id: 'file-1',
        name: 'Report.pdf',
        size: 1024,
        mimeType: 'application/pdf',
        isFolder: false,
        ownerId: 'user-e2e-1',
        currentVersion: 1,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      downloadFile: jest.fn().mockResolvedValue({
        name: 'Report.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('%PDF-1.4 mock content'),
      }),
      renameItem: jest.fn().mockResolvedValue({
        id: 'file-1',
        name: 'UpdatedReport.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      }),
      moveItem: jest.fn().mockResolvedValue({
        id: 'file-1',
        parentId: 'folder-target',
      }),
      deleteItem: jest.fn().mockResolvedValue({
        success: true,
        deletedId: 'file-1',
      }),
      createShare: jest.fn().mockResolvedValue({
        id: 'share-1',
        fileId: 'file-1',
        shareToken: 'token-abc-123',
        scope: ShareScope.ORGANIZATION,
        permission: SharePermission.VIEW,
      }),
      getFileShares: jest.fn().mockResolvedValue([]),
      revokeShare: jest.fn().mockResolvedValue({ success: true, revokedId: 'share-1' }),
      getByShareToken: jest.fn().mockResolvedValue({
        file: { id: 'file-1', name: 'Report.pdf' },
        permission: SharePermission.VIEW,
        scope: ShareScope.ORGANIZATION,
      }),
      getVersionHistory: jest.fn().mockResolvedValue([
        { versionNumber: 2, size: 2048 },
        { versionNumber: 1, size: 1024 },
      ]),
      restoreVersion: jest.fn().mockResolvedValue({
        id: 'file-1',
        currentVersion: 1,
      }),
      createAccessRequest: jest.fn().mockResolvedValue({
        id: 'req-1',
        fileId: 'file-1',
        requesterId: 'user-e2e-1',
        requestedPermission: SharePermission.VIEW,
        status: AccessRequestStatus.PENDING,
      }),
      getPendingRequestsForOwner: jest.fn().mockResolvedValue([]),
      reviewAccessRequest: jest.fn().mockResolvedValue({
        id: 'req-1',
        status: AccessRequestStatus.APPROVED,
      }),
      createAttachment: jest.fn().mockResolvedValue({
        id: 'att-1',
        fileName: 'chat-img.png',
        mimeType: 'image/png',
      }),
      getAttachment: jest.fn().mockResolvedValue({
        attachment: { fileName: 'chat-img.png', mimeType: 'image/png' },
        buffer: Buffer.from('image bytes'),
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    filesService = moduleRef.get(FilesService);
  });

  afterAll(async () => {
    await app.close();
  });

  // D-001: Views
  it('GET /files/my-files returns user files and breadcrumbs', async () => {
    const res = await request(app.getHttpServer()).get('/files/my-files').expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.breadcrumbs).toHaveLength(1);
  });

  it('GET /files/recent returns recent files', async () => {
    await request(app.getHttpServer()).get('/files/recent').expect(200);
    expect(filesService.getRecentFiles).toHaveBeenCalledWith(mockUser.id);
  });

  it('GET /files/shared-with-me returns shared files', async () => {
    await request(app.getHttpServer()).get('/files/shared-with-me').expect(200);
    expect(filesService.getSharedWithMe).toHaveBeenCalledWith(mockUser.id);
  });

  // D-002: Folders & File Operations
  it('POST /files/folder creates new folder', async () => {
    const res = await request(app.getHttpServer())
      .post('/files/folder')
      .send({ name: 'Marketing' })
      .expect(201);
    expect(res.body.name).toBe('Marketing');
    expect(res.body.isFolder).toBe(true);
  });

  it('POST /files/upload accepts multipart file upload', async () => {
    const res = await request(app.getHttpServer())
      .post('/files/upload')
      .attach('file', Buffer.from('test file data'), 'uploaded.txt')
      .expect(201);
    expect(res.body.name).toBe('uploaded.txt');
  });

  it('GET /files/:id/download streams attachment file', async () => {
    const res = await request(app.getHttpServer())
      .get('/files/file-1/download')
      .expect(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('GET /files/:id/preview streams inline preview', async () => {
    const res = await request(app.getHttpServer())
      .get('/files/file-1/preview')
      .expect(200);
    expect(res.headers['content-disposition']).toContain('inline');
  });

  it('PATCH /files/:id/rename renames file', async () => {
    const res = await request(app.getHttpServer())
      .patch('/files/file-1/rename')
      .send({ name: 'UpdatedReport.pdf' })
      .expect(200);
    expect(res.body.name).toBe('UpdatedReport.pdf');
  });

  it('PATCH /files/:id/move moves file to another folder', async () => {
    const res = await request(app.getHttpServer())
      .patch('/files/file-1/move')
      .send({ targetParentId: 'folder-target' })
      .expect(200);
    expect(res.body.parentId).toBe('folder-target');
  });

  it('DELETE /files/:id deletes file', async () => {
    const res = await request(app.getHttpServer()).delete('/files/file-1').expect(200);
    expect(res.body.success).toBe(true);
  });

  // D-004: Sharing Links
  it('POST /files/:id/shares creates share link', async () => {
    const res = await request(app.getHttpServer())
      .post('/files/file-1/shares')
      .send({
        permission: SharePermission.VIEW,
        scope: ShareScope.ORGANIZATION,
      })
      .expect(201);
    expect(res.body.shareToken).toBe('token-abc-123');
  });

  it('GET /files/shared/token/:token gets file by share token without auth', async () => {
    const res = await request(app.getHttpServer())
      .get('/files/shared/token/token-abc-123')
      .expect(200);
    expect(res.body.file.id).toBe('file-1');
  });

  // D-005: Version History
  it('GET /files/:id/versions retrieves version history', async () => {
    const res = await request(app.getHttpServer())
      .get('/files/file-1/versions')
      .expect(200);
    expect(res.body).toHaveLength(2);
  });

  it('POST /files/:id/versions/:versionNumber/restore restores past version', async () => {
    const res = await request(app.getHttpServer())
      .post('/files/file-1/versions/1/restore')
      .expect(200);
    expect(res.body.currentVersion).toBe(1);
  });

  // D-009: File Access Requests
  it('POST /files/access-requests creates access request', async () => {
    const res = await request(app.getHttpServer())
      .post('/files/access-requests')
      .send({
        fileId: 'file-1',
        requestedPermission: SharePermission.VIEW,
        note: 'Need review',
      })
      .expect(201);
    expect(res.body.id).toBe('req-1');
  });

  it('PATCH /files/access-requests/:id reviews access request', async () => {
    const res = await request(app.getHttpServer())
      .patch('/files/access-requests/req-1')
      .send({
        status: AccessRequestStatus.APPROVED,
        grantedPermission: SharePermission.VIEW,
      })
      .expect(200);
    expect(res.body.status).toBe(AccessRequestStatus.APPROVED);
  });

  // Generic Attachment API (C-011 shared)
  it('POST /files/attachments creates attachment for chat message', async () => {
    const res = await request(app.getHttpServer())
      .post('/files/attachments')
      .attach('file', Buffer.from('image bytes'), 'chat-img.png')
      .expect(201);
    expect(res.body.fileName).toBe('chat-img.png');
  });

  it('GET /files/attachments/:id retrieves attachment stream', async () => {
    const res = await request(app.getHttpServer())
      .get('/files/attachments/att-1')
      .expect(200);
    expect(res.headers['content-type']).toContain('image/png');
  });
});
