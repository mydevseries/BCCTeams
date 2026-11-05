import { test, expect } from '@playwright/test';

test.describe('C-006: Emoji picker, GIFs, and Stickers', () => {
  const timestamp = Date.now();
  const userA = {
    email: `alice_c006_${timestamp}@bccteams.local`,
    name: `Alice C006 ${timestamp}`,
    password: 'Password123!',
  };
  const userB = {
    email: `bob_c006_${timestamp}@bccteams.local`,
    name: `Bob C006 ${timestamp}`,
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

  test('AC 1, AC 2, AC 3 & AC 4: Emoji search & insertion, GIF search & send, Sticker sending', async ({
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

    // 1. Open Emoji picker
    const pickerBtn = page.getByRole('button', { name: /open emoji, gif, and sticker picker/i });
    await expect(pickerBtn).toBeVisible();
    await pickerBtn.click();

    // Search emoji
    const emojiSearch = page.getByLabelText(/search picker items/i);
    await expect(emojiSearch).toBeVisible();
    await emojiSearch.fill('rocket');

    const rocketBtn = page.getByRole('button', { name: 'Rocket' });
    await expect(rocketBtn).toBeVisible();
    await rocketBtn.click();

    // Verify emoji inserted into composer textarea
    const composer = page.locator('textarea[placeholder*="message"]').first();
    await expect(composer).toHaveValue('🚀');

    // Send emoji message
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.locator('text=🚀').first()).toBeVisible();

    // 2. Open Picker -> GIFs tab -> select GIF
    await pickerBtn.click();
    await page.getByRole('tab', { name: /gifs/i }).click();

    const gifCard = page.getByRole('button', { name: /send gif: celebration confetti/i });
    await expect(gifCard).toBeVisible({ timeout: 10000 });
    await gifCard.click();

    // Verify GIF image rendered in chat
    const gifImage = page.locator('img[alt="GIF: Celebration Confetti"]').first();
    await expect(gifImage).toBeVisible({ timeout: 10000 });

    // 3. Open Picker -> Stickers tab -> select BCC Sticker
    await pickerBtn.click();
    await page.getByRole('tab', { name: /stickers/i }).click();

    const stickerCard = page.getByRole('button', { name: /send sticker: great job!/i });
    await expect(stickerCard).toBeVisible({ timeout: 10000 });
    await stickerCard.click();

    // Verify Sticker image rendered in chat
    const stickerImage = page.locator('img[alt="Sticker: Great Job!"]').first();
    await expect(stickerImage).toBeVisible({ timeout: 10000 });

    await context.close();
  });
});
