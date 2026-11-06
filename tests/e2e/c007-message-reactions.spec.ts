import { test, expect } from '@playwright/test';

test.describe('C-007: Message Reactions', () => {
  const timestamp = Date.now();
  const userA = {
    email: `alice_c007_${timestamp}@bccteams.local`,
    name: `Alice C007 ${timestamp}`,
    password: 'Password123!',
  };
  const userB = {
    email: `bob_c007_${timestamp}@bccteams.local`,
    name: `Bob C007 ${timestamp}`,
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

  test('AC 1 to 5: Quick reaction hover, badge increment, toggle off, tooltip, and custom emoji picker', async ({
    browser,
  }) => {
    test.setTimeout(90000);

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/signin');
    await page.fill('input[type="email"]', userA.email);
    await page.fill('input[type="password"]', userA.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/chat/);
    await page.waitForLoadState('networkidle');

    // Start 1:1 chat with Bob
    const newChatBtn = page.getByRole('button', { name: /new chat/i });
    if (await newChatBtn.isVisible()) {
      await newChatBtn.click();
    }
    const searchInput = page.locator('input[placeholder*="name"]').first();
    await searchInput.fill(userB.name.slice(0, 5));
    const suggestion = page.locator(`text=${userB.name}`).first();
    await expect(suggestion).toBeVisible({ timeout: 10000 });
    await suggestion.click();

    // Send a message
    const composer = page.locator('[contenteditable="true"], textarea, input[placeholder*="message"]').first();
    await composer.fill('Reaction testing message');
    await page.keyboard.press('Enter');

    // Message should appear
    const messageItem = page.locator('[data-testid^="message-item-"]').first();
    await expect(messageItem).toBeVisible({ timeout: 10000 });

    // AC 1: Hover over message to reveal reaction bar
    await messageItem.hover();
    const reactionBar = page.locator('[role="toolbar"][aria-label="Reactions bar"]').first();
    await expect(reactionBar).toBeVisible();

    // AC 2: Click Thumbs up reaction
    const likeBtn = page.getByRole('button', { name: 'React with Like' }).first();
    await likeBtn.click();

    // Reaction badge should appear with count 1
    const thumbsBadge = page.locator('[data-testid="reaction-badge-👍"]').first();
    await expect(thumbsBadge).toBeVisible({ timeout: 5000 });
    await expect(thumbsBadge).toContainText('1');

    // AC 4: Hover over reaction badge to view tooltip with user's name
    await thumbsBadge.hover();
    const tooltip = page.locator(`text=${userA.name}`).first();
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    // AC 3: Click again to toggle off
    await thumbsBadge.click();
    await expect(thumbsBadge).not.toBeVisible({ timeout: 5000 });

    // AC 5: Custom emoji picker reaction
    await messageItem.hover();
    const moreReactionsBtn = page.getByRole('button', { name: 'More reactions' }).first();
    await moreReactionsBtn.click();

    const emojiSearch = page.getByLabel('Search reaction emoji');
    await expect(emojiSearch).toBeVisible({ timeout: 5000 });
    await emojiSearch.fill('fire');

    const fireBtn = page.getByRole('button', { name: 'Fire' }).first();
    await fireBtn.click();

    // Fire reaction badge should appear
    const fireBadge = page.locator('[data-testid="reaction-badge-🔥"]').first();
    await expect(fireBadge).toBeVisible({ timeout: 5000 });
    await expect(fireBadge).toContainText('1');

    await context.close();
  });
});

