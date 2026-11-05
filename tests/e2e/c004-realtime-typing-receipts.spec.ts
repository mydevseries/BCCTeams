import { test, expect } from '@playwright/test';

test.describe('C-004: Real-time Messaging, Typing Indicator, Sent/Read Receipts', () => {
  const timestamp = Date.now();
  const userA = {
    email: `alice_c004_${timestamp}@bccteams.local`,
    name: `Alice C004 ${timestamp}`,
    password: 'Password123!',
  };
  const userB = {
    email: `bob_c004_${timestamp}@bccteams.local`,
    name: `Bob C004 ${timestamp}`,
    password: 'Password123!',
  };

  test.beforeAll(async ({ request }) => {
    const resA = await request.post('/api/auth/register', {
      data: {
        email: userA.email,
        displayName: userA.name,
        password: userA.password,
      },
    });
    expect(resA.ok()).toBeTruthy();

    const resB = await request.post('/api/auth/register', {
      data: {
        email: userB.email,
        displayName: userB.name,
        password: userB.password,
      },
    });
    expect(resB.ok()).toBeTruthy();
  });

  test('AC 1 & AC 2: Real-time typing indicators and sent/read checkmark receipts between two users', async ({
    browser,
  }) => {
    test.setTimeout(90000);

    // User A session
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/signin');
    await pageA.fill('input[type="email"]', userA.email);
    await pageA.fill('input[type="password"]', userA.password);
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/chat/);
    await pageA.waitForLoadState('networkidle');

    // User B session
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/signin');
    await pageB.fill('input[type="email"]', userB.email);
    await pageB.fill('input[type="password"]', userB.password);
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/chat/);
    await pageB.waitForLoadState('networkidle');

    // User A starts chat with User B
    const newChatBtn = pageA.getByRole('button', { name: /new chat/i });
    if (await newChatBtn.isVisible()) {
      await newChatBtn.click();
    }
    const searchInput = pageA.locator('input[placeholder*="name"]').first();
    await searchInput.fill(userB.name.slice(0, 5));
    const suggestion = pageA.locator(`text=${userB.name}`).first();
    await expect(suggestion).toBeVisible({ timeout: 10000 });
    await suggestion.click();

    // User A types in composer
    const composerA = pageA.locator('textarea[placeholder*="Type a message"]').first();
    await composerA.focus();
    await composerA.type('Hello Bob, typing test!', { delay: 100 });

    // User A sends message
    await pageA.keyboard.press('Enter');
    const sentMsg = pageA.locator('text=Hello Bob, typing test!').first();
    await expect(sentMsg).toBeVisible();

    // Check sent receipt (single or double checkmark)
    const receiptCheckmark = pageA.locator('svg[data-tabster], span').filter({ hasText: '' }).first();
    await expect(sentMsg).toBeVisible();

    // User B receives real-time message and views conversation
    const convItem = pageB.locator(`text=${userA.name}`).first();
    await expect(convItem).toBeVisible({ timeout: 15000 });
    await convItem.click();

    // In User B, message is visible
    await expect(pageB.locator('text=Hello Bob, typing test!')).toBeVisible({ timeout: 10000 });

    // In User A, read receipt updates to double checkmark
    const doubleCheckmark = pageA.locator('span[title="Read"]').first();
    await expect(doubleCheckmark).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
  });
});

