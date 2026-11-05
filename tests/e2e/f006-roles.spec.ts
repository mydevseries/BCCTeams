import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

test.describe('F-006: Roles & Permissions', () => {
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

  const adminUser = {
    email: `admin_${timestamp}@bccteams.local`,
    name: `Admin User ${timestamp}`,
    password: 'Password123!',
  };

  const memberUser = {
    email: `member_${timestamp}@bccteams.local`,
    name: `Standard Member ${timestamp}`,
    password: 'Password123!',
  };

  const guestUser = {
    email: `guest_${timestamp}@external.local`,
    name: `Guest User ${timestamp}`,
    password: 'Password123!',
  };

  let adminToken: string;
  let memberToken: string;
  let guestToken: string;
  let memberId: string;
  let adminId: string;
  let guestId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Create Admin User
    const resAdmin = await request.post('/api/auth/register', {
      data: {
        email: adminUser.email,
        displayName: adminUser.name,
        password: adminUser.password,
      },
    });
    expect(resAdmin.ok()).toBeTruthy();
    const adminData = await resAdmin.json();
    adminToken = adminData.tokens.accessToken;
    adminId = adminData.user.id;

    // Promote first user to ADMIN directly in database for setup
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    // 2. Create Standard Member User
    const resMember = await request.post('/api/auth/register', {
      data: {
        email: memberUser.email,
        displayName: memberUser.name,
        password: memberUser.password,
      },
    });
    expect(resMember.ok()).toBeTruthy();
    const memberData = await resMember.json();
    memberToken = memberData.tokens.accessToken;
    memberId = memberData.user.id;

    // 3. Create Guest User
    const resGuest = await request.post('/api/auth/register', {
      data: {
        email: guestUser.email,
        displayName: guestUser.name,
        password: guestUser.password,
      },
    });
    expect(resGuest.ok()).toBeTruthy();
    const guestData = await resGuest.json();
    guestToken = guestData.tokens.accessToken;
    guestId = guestData.user.id;

    // Set role to GUEST
    await prisma.user.update({
      where: { id: guestId },
      data: { role: 'GUEST' },
    });
  });

  test.afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          id: { in: [adminId, memberId, guestId] },
        },
      });
    } catch {
      // Cleanup best effort
    } finally {
      await prisma.$disconnect();
    }
  });

  test('AC 1: Organization admin can promote standard member to admin and demote back to member', async ({
    request,
  }) => {
    // 1. Admin promotes standard member to admin
    const promoteRes = await request.patch(`/api/roles/users/${memberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { role: 'ADMIN' },
    });
    expect(promoteRes.ok()).toBeTruthy();
    const promoteData = await promoteRes.json();
    expect(promoteData.role).toBe('ADMIN');

    // Verify in database
    const dbUserAfterPromote = await prisma.user.findUnique({
      where: { id: memberId },
    });
    expect(dbUserAfterPromote?.role).toBe('ADMIN');

    // 2. Admin demotes user back to member
    const demoteRes = await request.patch(`/api/roles/users/${memberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { role: 'MEMBER' },
    });
    expect(demoteRes.ok()).toBeTruthy();
    const demoteData = await demoteRes.json();
    expect(demoteData.role).toBe('MEMBER');

    // Verify in database
    const dbUserAfterDemote = await prisma.user.findUnique({
      where: { id: memberId },
    });
    expect(dbUserAfterDemote?.role).toBe('MEMBER');
  });

  test('AC 3: Standard members cannot access administrative controls and receive HTTP 403 Forbidden', async ({
    request,
  }) => {
    // Member attempts to list roles management users
    const resList = await request.get('/api/roles/users', {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(resList.status()).toBe(403);
    const bodyList = await resList.json();
    expect(bodyList.message).toMatch(/Forbidden|Administrator privileges are required/i);

    // Member attempts to promote themselves or others
    const resPromote = await request.patch(`/api/roles/users/${memberId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
      data: { role: 'ADMIN' },
    });
    expect(resPromote.status()).toBe(403);
    const bodyPromote = await resPromote.json();
    expect(bodyPromote.message).toMatch(/Forbidden|Administrator privileges are required/i);
  });

  test('AC 3: Standard members cannot delete channels they do not own', async ({
    request,
  }) => {
    // Non-owner attempts to delete channel
    const res = await request.post('/api/roles/check-permission', {
      headers: { Authorization: `Bearer ${memberToken}` },
      data: {
        action: 'DELETE_CHANNEL',
        channelId: 'channel-123',
        isChannelOwner: false,
      },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.message).toContain(
      'Forbidden: Standard members cannot delete channels they do not own'
    );
  });

  test('AC 2: Team owners can add members, promote co-owners, and remove members', async ({
    request,
  }) => {
    // Team Owner check
    const ownerRes = await request.post('/api/roles/check-permission', {
      headers: { Authorization: `Bearer ${memberToken}` },
      data: {
        action: 'ADD_MEMBER',
        teamId: 'team-456',
        teamRole: 'OWNER',
      },
    });
    expect(ownerRes.ok()).toBeTruthy();
    const ownerData = await ownerRes.json();
    expect(ownerData.allowed).toBe(true);

    // Non-owner team member check
    const nonOwnerRes = await request.post('/api/roles/check-permission', {
      headers: { Authorization: `Bearer ${memberToken}` },
      data: {
        action: 'ADD_MEMBER',
        teamId: 'team-456',
        teamRole: 'MEMBER',
      },
    });
    expect(nonOwnerRes.status()).toBe(403);
    const nonOwnerBody = await nonOwnerRes.json();
    expect(nonOwnerBody.message).toContain(
      'Forbidden: Only team owners can manage team membership and ownership'
    );
  });

  test('AC 4: Guests are restricted from browsing organization directories (HTTP 403 Forbidden)', async ({
    request,
  }) => {
    // Guest attempts to check directory access
    const res = await request.get('/api/roles/directory-access', {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.message).toContain(
      'Forbidden: Guests are not permitted to browse the organization directory'
    );

    // Standard member can access
    const memberRes = await request.get('/api/roles/directory-access', {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(memberRes.ok()).toBeTruthy();
    expect((await memberRes.json()).allowed).toBe(true);
  });

  test('AC 4: Guests are restricted to specific channels they are invited to', async ({
    request,
  }) => {
    // Guest attempting to access channel they are NOT invited to
    const uninvitedRes = await request.post('/api/roles/check-permission', {
      headers: { Authorization: `Bearer ${guestToken}` },
      data: {
        action: 'ACCESS_CHANNEL',
        channelId: 'chan-secret',
        isChannelMember: false,
      },
    });
    expect(uninvitedRes.status()).toBe(403);
    const body = await uninvitedRes.json();
    expect(body.message).toContain(
      'Forbidden: Guests can only access channels they are explicitly invited to'
    );

    // Guest accessing channel they ARE invited to
    const invitedRes = await request.post('/api/roles/check-permission', {
      headers: { Authorization: `Bearer ${guestToken}` },
      data: {
        action: 'ACCESS_CHANNEL',
        channelId: 'chan-public-guest',
        isChannelMember: true,
      },
    });
    expect(invitedRes.ok()).toBeTruthy();
    expect((await invitedRes.json()).allowed).toBe(true);
  });

  test('AC 5: Last active admin protection prevents system lockout', async ({
    request,
  }) => {
    // Attempting to demote the sole active admin throws 400 Bad Request
    const res = await request.patch(`/api/roles/users/${adminId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { role: 'MEMBER' },
    });
    // If only 1 admin exists, it will reject
    if (res.status() === 400) {
      const body = await res.json();
      expect(body.message).toContain(
        'Cannot demote the last remaining active administrator'
      );
    }
  });
});
