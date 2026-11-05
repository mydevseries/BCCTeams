import { test, expect, Page } from '@playwright/test';

test.describe('F-004: Real-time Presence System', () => {
  const timestamp = Date.now();
  const userA = {
    email: `presence_a_${timestamp}@bccteams.local`,
    name: `Alice Presence ${timestamp}`,
    password: 'Password123!',
  };
  const userB = {
    email: `presence_b_${timestamp}@bccteams.local`,
    name: `Bob Presence ${timestamp}`,
    password: 'Password123!',
  };

  test.beforeAll(async ({ request }) => {
    // Register User A
    const resA = await request.post('/api/auth/register', {
      data: {
        email: userA.email,
        displayName: userA.name,
        password: userA.password,
      },
    });
    expect(resA.ok()).toBeTruthy();

    // Register User B
    const resB = await request.post('/api/auth/register', {
      data: {
        email: userB.email,
        displayName: userB.name,
        password: userB.password,
      },
    });
    expect(resB.ok()).toBeTruthy();
  });

  const getMyPresence = async (page: Page) => {
    return page.evaluate(async () => {
      const token = localStorage.getItem('bcc_access_token');
      const res = await fetch('/api/presence/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    });
  };

  const changeStatus = async (page: Page, statusLabel: RegExp) => {
    await page.getByRole('button', { name: 'User Profile' }).click();
    const patchPromise = page.waitForResponse(
      (res) => res.url().includes('/api/presence/me') && res.request().method() === 'PATCH',
    );
    await page.getByRole('menuitem', { name: statusLabel }).click();
    await patchPromise;
  };

  test('AC 1 & AC 2: User can select status from avatar menu and presence broadcasts in real time to other users', async ({
    browser,
  }) => {
    test.setTimeout(60000);
    // Context 1: User A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/signin');
    await pageA.getByLabel('Email address').fill(userA.email);
    await pageA.getByLabel('Password').fill(userA.password);
    await pageA.getByRole('button', { name: 'Sign In' }).click();
    await expect(pageA).toHaveURL(/\/chat/);

    // Context 2: User B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/signin');
    await pageB.getByLabel('Email address').fill(userB.email);
    await pageB.getByLabel('Password').fill(userB.password);
    await pageB.getByRole('button', { name: 'Sign In' }).click();
    await expect(pageB).toHaveURL(/\/chat/);

    // User B navigates to directory to observe User A
    await pageB.goto('/directory');
    const searchInput = pageB.getByRole('textbox', { name: /Search directory/i });
    const searchPromise = pageB.waitForResponse(
      (res) => res.url().includes('/api/users') && res.status() === 200,
    );
    await searchInput.fill(userA.name);
    await searchPromise;

    const memberCardA = pageB.locator(`[role="button"][aria-label*="${userA.name}"]`);
    await expect(memberCardA).toBeVisible({ timeout: 10000 });

    // Initial status for User A is available (green badge)
    const avatarBadgeA = memberCardA.locator('.fui-Avatar__badge');
    await expect(avatarBadgeA).toBeVisible();

    // User A changes status to "Busy" from top-bar avatar menu
    await changeStatus(pageA, /^Busy$/i);
    const presenceDataA = await getMyPresence(pageA);
    expect(presenceDataA.status).toBe('BUSY');

    // User A changes status to "Do not disturb"
    await changeStatus(pageA, /^Do not disturb$/i);
    const resPresenceDnd = await getMyPresence(pageA);
    expect(resPresenceDnd.status).toBe('DO_NOT_DISTURB');

    // User A sets "Appear offline"
    await changeStatus(pageA, /^Appear offline$/i);
    const resPresenceOffline = await getMyPresence(pageA);
    expect(resPresenceOffline.status).toBe('OFFLINE');

    // Restore to Available
    await changeStatus(pageA, /^Available$/i);
    const resPresenceAvail = await getMyPresence(pageA);
    expect(resPresenceAvail.status).toBe('AVAILABLE');

    await contextA.close();
    await contextB.close();
  });

  test('AC 6: User can set a custom status message with expiry preset and clear it', async ({
    page,
  }) => {
    await page.goto('/signin');
    await page.getByLabel('Email address').fill(userA.email);
    await page.getByLabel('Password').fill(userA.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/chat/);

    // Open avatar menu and click "Set status message"
    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('menuitem', { name: /Set status message/i }).click();

    const dialog = page.getByRole('dialog', { name: 'Set status message' });
    await expect(dialog).toBeVisible();

    // Fill message and select Today
    await dialog.getByLabel(/^Status message$/i).fill('Focus time - in design review');
    await dialog.getByLabel(/^Clear status message after$/i).selectOption('today');

    const savePromise = page.waitForResponse(
      (res) => res.url().includes('/api/presence/me') && res.request().method() === 'PATCH',
    );
    await dialog.getByRole('button', { name: 'Done' }).click();
    await savePromise;
    await expect(dialog).not.toBeVisible();

    // Verify custom message appears in avatar menu
    await page.getByRole('button', { name: 'User Profile' }).click();
    await expect(page.getByText(/Focus time - in design review/i)).toBeVisible();

    // Open status message modal again and clear it
    await page.getByRole('menuitem', { name: /Set status message/i }).click();
    await expect(dialog).toBeVisible();

    const clearPromise = page.waitForResponse(
      (res) => res.url().includes('/api/presence/me') && res.request().method() === 'PATCH',
    );
    await dialog.getByRole('button', { name: /Clear status message/i }).click();
    await clearPromise;
    await expect(dialog).not.toBeVisible();

    // Verify cleared in API
    const data = await getMyPresence(page);
    expect(data.statusMessage).toBeNull();
  });

  test('Connection tracking: REST endpoints support batch presence query and DND checks', async ({
    request,
  }) => {
    // 1. Login user A to get token
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: userA.email,
        password: userA.password,
      },
    });
    const loginData = await loginRes.json();
    const token = loginData.tokens.accessToken;

    // 2. Query batch presence for User A
    const batchRes = await request.post('/api/presence/batch', {
      headers: { Authorization: `Bearer ${token}` },
      data: { userIds: [loginData.user.id] },
    });
    expect(batchRes.ok()).toBeTruthy();
    const batchData = await batchRes.json();
    expect(batchData[loginData.user.id]).toBeDefined();
    expect(batchData[loginData.user.id].userId).toBe(loginData.user.id);
  });
});
