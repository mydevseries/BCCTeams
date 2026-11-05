import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

test.describe('Phase 5: Files (D-001 through D-005, D-009)', () => {
  const timestamp = Date.now();
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@127.0.0.1:5433/bccteams?schema=public',
      },
    },
  });

  const ownerUser = {
    email: `owner_${timestamp}@bccteams.local`,
    name: `File Owner ${timestamp}`,
    password: 'Password123!',
  };

  const colleagueUser = {
    email: `colleague_${timestamp}@bccteams.local`,
    name: `Colleague User ${timestamp}`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let ownerId: string;
  let colleagueToken: string;
  let colleagueId: string;

  // Track created resources for cleanup
  const createdFileIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    // 1. Create Owner User
    const resOwner = await request.post('/api/auth/register', {
      data: {
        email: ownerUser.email,
        displayName: ownerUser.name,
        password: ownerUser.password,
      },
    });
    expect(resOwner.ok()).toBeTruthy();
    const ownerData = await resOwner.json();
    ownerToken = ownerData.tokens.accessToken;
    ownerId = ownerData.user.id;

    // 2. Create Colleague User
    const resColleague = await request.post('/api/auth/register', {
      data: {
        email: colleagueUser.email,
        displayName: colleagueUser.name,
        password: colleagueUser.password,
      },
    });
    expect(resColleague.ok()).toBeTruthy();
    const colleagueData = await resColleague.json();
    colleagueToken = colleagueData.tokens.accessToken;
    colleagueId = colleagueData.user.id;
  });

  test.afterAll(async () => {
    try {
      if (createdFileIds.length > 0) {
        await prisma.fileItem.deleteMany({
          where: { id: { in: createdFileIds } },
        });
      }
      await prisma.user.deleteMany({
        where: { id: { in: [ownerId, colleagueId] } },
      });
    } catch {
      // Cleanup best effort
    } finally {
      await prisma.$disconnect();
    }
  });

  // =========================================================================
  // D-001 & D-002: Folders & File Management (Upload, Breadcrumbs, Rename, Move, Delete, Download)
  // =========================================================================

  let folderId: string;
  let uploadedFileId: string;

  test('D-002: Create folder in root and upload file into folder', async ({ request }) => {
    // 1. Create a folder
    const createFolderRes = await request.post('/api/files/folder', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { name: 'Projects' },
    });
    expect(createFolderRes.ok()).toBeTruthy();
    const folder = await createFolderRes.json();
    expect(folder.name).toBe('Projects');
    expect(folder.isFolder).toBe(true);
    folderId = folder.id;
    createdFileIds.push(folderId);

    // 2. Upload file into the created folder using multipart/form-data
    const fileBuffer = Buffer.from('Hello BCC Teams file storage content!');
    const uploadRes = await request.post('/api/files/upload', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      multipart: {
        parentId: folderId,
        file: {
          name: 'project-specs.txt',
          mimeType: 'text/plain',
          buffer: fileBuffer,
        },
      },
    });
    expect(uploadRes.ok()).toBeTruthy();
    const uploaded = await uploadRes.json();
    expect(uploaded.name).toBe('project-specs.txt');
    expect(uploaded.parentId).toBe(folderId);
    expect(uploaded.currentVersion).toBe(1);
    uploadedFileId = uploaded.id;
    createdFileIds.push(uploadedFileId);
  });

  test('D-001: My files view lists items and builds folder breadcrumbs', async ({ request }) => {
    // List inside folder
    const folderViewRes = await request.get(`/api/files/my-files?parentId=${folderId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(folderViewRes.ok()).toBeTruthy();
    const folderView = await folderViewRes.json();
    expect(folderView.items.length).toBe(1);
    expect(folderView.items[0].id).toBe(uploadedFileId);

    // Breadcrumbs should have root and the current folder
    expect(folderView.breadcrumbs.length).toBe(2);
    expect(folderView.breadcrumbs[0].name).toBe('My files');
    expect(folderView.breadcrumbs[1].name).toBe('Projects');
  });

  test('D-001: Recent files view returns recently modified files', async ({ request }) => {
    const recentRes = await request.get('/api/files/recent', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(recentRes.ok()).toBeTruthy();
    const recent = await recentRes.json();
    const found = recent.some((f: any) => f.id === uploadedFileId);
    expect(found).toBe(true);
  });

  test('D-002: Download file initiates download with proper mime type and content-disposition', async ({
    request,
  }) => {
    const downloadRes = await request.get(`/api/files/${uploadedFileId}/download`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(downloadRes.ok()).toBeTruthy();
    expect(downloadRes.headers()['content-type']).toContain('text/plain');
    expect(downloadRes.headers()['content-disposition']).toContain('attachment');
    expect(downloadRes.headers()['content-disposition']).toContain('project-specs.txt');

    const bodyText = await downloadRes.text();
    expect(bodyText).toBe('Hello BCC Teams file storage content!');
  });

  test('D-002: Rename item updates file name', async ({ request }) => {
    const renameRes = await request.patch(`/api/files/${uploadedFileId}/rename`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { name: 'project-specs-v1.txt' },
    });
    expect(renameRes.ok()).toBeTruthy();
    const updated = await renameRes.json();
    expect(updated.name).toBe('project-specs-v1.txt');
  });

  test('D-002: Move item to another parent folder', async ({ request }) => {
    // Create second folder
    const folder2Res = await request.post('/api/files/folder', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { name: 'Archive' },
    });
    expect(folder2Res.ok()).toBeTruthy();
    const folder2 = await folder2Res.json();
    createdFileIds.push(folder2.id);

    // Move file to folder2
    const moveRes = await request.patch(`/api/files/${uploadedFileId}/move`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { targetParentId: folder2.id },
    });
    expect(moveRes.ok()).toBeTruthy();
    const moved = await moveRes.json();
    expect(moved.parentId).toBe(folder2.id);
  });

  // =========================================================================
  // D-003: File Previews (Inline stream)
  // =========================================================================

  test('D-003: Preview stream returns inline disposition for preview viewing', async ({
    request,
  }) => {
    const previewRes = await request.get(`/api/files/${uploadedFileId}/preview`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(previewRes.ok()).toBeTruthy();
    expect(previewRes.headers()['content-type']).toContain('text/plain');
    expect(previewRes.headers()['content-disposition']).toContain('inline');
    const text = await previewRes.text();
    expect(text).toBe('Hello BCC Teams file storage content!');
  });

  // =========================================================================
  // D-004: Sharing & Permissions (Links, Org-Wide, Specific Users, Revocation)
  // =========================================================================

  let shareTokenValue: string;
  let shareId: string;

  test('D-004: Owner generates share link and colleague accesses file via share token', async ({
    request,
  }) => {
    // 1. Create org-wide share with VIEW permission
    const shareRes = await request.post(`/api/files/${uploadedFileId}/shares`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        permission: 'VIEW',
        scope: 'ORGANIZATION',
      },
    });
    expect(shareRes.ok()).toBeTruthy();
    const share = await shareRes.json();
    expect(share.shareToken).toBeTruthy();
    expect(share.permission).toBe('VIEW');
    shareTokenValue = share.shareToken;
    shareId = share.id;

    // 2. Colleague resolves file via share token
    const resolveRes = await request.get(`/api/files/shared/token/${shareTokenValue}`);
    expect(resolveRes.ok()).toBeTruthy();
    const resolveData = await resolveRes.json();
    expect(resolveData.file.id).toBe(uploadedFileId);
    expect(resolveData.permission).toBe('VIEW');

    // 3. Colleague downloads file using shareToken query parameter
    const downloadSharedRes = await request.get(
      `/api/files/${uploadedFileId}/download?shareToken=${shareTokenValue}`,
      { headers: { Authorization: `Bearer ${colleagueToken}` } }
    );
    expect(downloadSharedRes.ok()).toBeTruthy();
    expect(await downloadSharedRes.text()).toBe('Hello BCC Teams file storage content!');

    // 4. Shared with me view for colleague includes this shared file
    const sharedWithMeRes = await request.get('/api/files/shared-with-me', {
      headers: { Authorization: `Bearer ${colleagueToken}` },
    });
    expect(sharedWithMeRes.ok()).toBeTruthy();
    const sharedWithMeList = await sharedWithMeRes.json();
    expect(sharedWithMeList.some((f: any) => f.id === uploadedFileId)).toBe(true);

    // 5. Owner revokes share
    const revokeRes = await request.delete(`/api/files/shares/${shareId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(revokeRes.ok()).toBeTruthy();

    // 6. Colleague can no longer access with revoked token
    const revokedAccessRes = await request.get(`/api/files/shared/token/${shareTokenValue}`);
    expect(revokedAccessRes.status()).toBe(404);
  });

  // =========================================================================
  // D-005: Version History & Restore
  // =========================================================================

  test('D-005: Uploading duplicate file creates Version 2, and owner can restore Version 1', async ({
    request,
  }) => {
    // Get file's current parent folder
    const fileMetaRes = await request.get(`/api/files/${uploadedFileId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const currentMeta = await fileMetaRes.json();

    // 1. Upload new version under the same name and folder
    const v2Buffer = Buffer.from('Version 2 content updated!');
    const uploadV2Res = await request.post('/api/files/upload', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      multipart: {
        parentId: currentMeta.parentId,
        file: {
          name: currentMeta.name,
          mimeType: 'text/plain',
          buffer: v2Buffer,
        },
      },
    });
    expect(uploadV2Res.ok()).toBeTruthy();
    const v2File = await uploadV2Res.json();
    expect(v2File.id).toBe(uploadedFileId);
    expect(v2File.currentVersion).toBe(2);

    // 2. Fetch version history
    const historyRes = await request.get(`/api/files/${uploadedFileId}/versions`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(historyRes.ok()).toBeTruthy();
    const versions = await historyRes.json();
    expect(versions.length).toBe(2);
    expect(versions[0].versionNumber).toBe(2);
    expect(versions[1].versionNumber).toBe(1);

    // 3. Restore Version 1
    const restoreRes = await request.post(
      `/api/files/${uploadedFileId}/versions/1/restore`,
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    expect(restoreRes.ok()).toBeTruthy();
    const restored = await restoreRes.json();
    expect(restored.currentVersion).toBe(1);

    // 4. Verify downloaded content is now version 1
    const restoredDownloadRes = await request.get(`/api/files/${uploadedFileId}/download`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(await restoredDownloadRes.text()).toBe('Hello BCC Teams file storage content!');
  });

  // =========================================================================
  // D-009: File Access Requests (Restricted access -> Request -> Owner Review)
  // =========================================================================

  test('D-009: Colleague denied access can request access, and owner can approve it', async ({
    request,
  }) => {
    // 1. Colleague tries to access owner's private file without share -> 403 Forbidden
    const unauthRes = await request.get(`/api/files/${uploadedFileId}`, {
      headers: { Authorization: `Bearer ${colleagueToken}` },
    });
    expect(unauthRes.status()).toBe(403);

    // 2. Colleague submits an access request
    const reqRes = await request.post('/api/files/access-requests', {
      headers: { Authorization: `Bearer ${colleagueToken}` },
      data: {
        fileId: uploadedFileId,
        requestedPermission: 'VIEW',
        note: 'Need access to test specifications',
      },
    });
    expect(reqRes.ok()).toBeTruthy();
    const accessReq = await reqRes.json();
    expect(accessReq.status).toBe('PENDING');
    expect(accessReq.requestedPermission).toBe('VIEW');
    const requestId = accessReq.id;

    // 3. Owner gets pending access requests list
    const pendingRes = await request.get('/api/files/access-requests/pending', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(pendingRes.ok()).toBeTruthy();
    const pendingList = await pendingRes.json();
    const foundReq = pendingList.find((r: any) => r.id === requestId);
    expect(foundReq).toBeTruthy();
    expect(foundReq.requester.id).toBe(colleagueId);

    // 4. Owner approves the request with VIEW permission
    const reviewRes = await request.patch(`/api/files/access-requests/${requestId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        status: 'APPROVED',
        grantedPermission: 'VIEW',
      },
    });
    expect(reviewRes.ok()).toBeTruthy();
    const reviewed = await reviewRes.json();
    expect(reviewed.status).toBe('APPROVED');

    // 5. Colleague can now access and download the file immediately
    const grantedAccessRes = await request.get(`/api/files/${uploadedFileId}`, {
      headers: { Authorization: `Bearer ${colleagueToken}` },
    });
    expect(grantedAccessRes.ok()).toBeTruthy();
    const fileData = await grantedAccessRes.json();
    expect(fileData.id).toBe(uploadedFileId);

    const colleagueDownload = await request.get(`/api/files/${uploadedFileId}/download`, {
      headers: { Authorization: `Bearer ${colleagueToken}` },
    });
    expect(colleagueDownload.ok()).toBeTruthy();
  });

  // =========================================================================
  // Generic Attachment API (Shared for Chat C-011)
  // =========================================================================

  test('Shared Attachment API: Upload and stream attachment for chat integration', async ({
    request,
  }) => {
    const attBuffer = Buffer.from('Attachment file bytes for chat message');
    const uploadAttRes = await request.post('/api/files/attachments', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      multipart: {
        file: {
          name: 'attached-diagram.png',
          mimeType: 'image/png',
          buffer: attBuffer,
        },
      },
    });
    expect(uploadAttRes.ok()).toBeTruthy();
    const attachment = await uploadAttRes.json();
    expect(attachment.fileName).toBe('attached-diagram.png');
    expect(attachment.mimeType).toBe('image/png');

    // Stream attachment
    const streamRes = await request.get(`/api/files/attachments/${attachment.id}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(streamRes.ok()).toBeTruthy();
    expect(streamRes.headers()['content-type']).toBe('image/png');
    const streamBody = await streamRes.body();
    expect(streamBody.toString()).toBe('Attachment file bytes for chat message');
  });

  // =========================================================================
  // Delete Item & Cascade
  // =========================================================================

  test('D-002: Delete folder cascades deletion to contained files', async ({ request }) => {
    const deleteRes = await request.delete(`/api/files/${folderId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(deleteRes.ok()).toBeTruthy();

    // Verify folder is gone
    const getFolderRes = await request.get(`/api/files/${folderId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(getFolderRes.status()).toBe(404);
  });
});
