import { test, expect } from '@playwright/test';

test.describe('C-005: Rich Text Formatting in Messages', () => {
  const timestamp = Date.now();
  const userA = {
    email: `alice_c005_${timestamp}@bccteams.local`,
    name: `Alice C005 ${timestamp}`,
    password: 'Password123!',
  };
  const userB = {
    email: `bob_c005_${timestamp}@bccteams.local`,
    name: `Bob C005 ${timestamp}`,
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

  test('AC 1, AC 2, AC 3 & AC 4: Rich text format toolbar, bold/italic/headings, lists, code blocks, and links', async ({
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

    // Toggle format toolbar
    const formatBtn = page.getByRole('button', { name: /toggle rich text format/i });
    await expect(formatBtn).toBeVisible();
    await formatBtn.click();

    // Verify format toolbar buttons exist
    await expect(page.getByRole('button', { name: /heading 1/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /bold/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /italic/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /underline/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /strikethrough/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /blockquote/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /bulleted list/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /numbered list/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /code block/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /insert link/i })).toBeVisible();

    // Compose a rich message with bold, heading, bullet list, code block, and link
    const composer = page.locator('textarea[placeholder*="message"]').first();
    await composer.fill(
      '# Project Update\n\n' +
      'Here are the **important details** for the team:\n' +
      '- Bullet Item Alpha\n' +
      '- Bullet Item Beta\n\n' +
      'Check the [Documentation](https://bccteams.org/docs)\n\n' +
      '```typescript\nconst status = "success";\n```'
    );

    // Click Send
    const sendBtn = page.getByRole('button', { name: /send message/i });
    await sendBtn.click();

    // Verify rendered rich elements in the message feed
    await expect(page.locator('text=Project Update').first()).toBeVisible();
    await expect(page.locator('strong:has-text("important details")').first()).toBeVisible();
    await expect(page.locator('li:has-text("Bullet Item Alpha")').first()).toBeVisible();
    await expect(page.locator('li:has-text("Bullet Item Beta")').first()).toBeVisible();

    const link = page.locator('a:has-text("Documentation")').first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://bccteams.org/docs');
    await expect(link).toHaveAttribute('target', '_blank');

    await expect(page.locator('code:has-text("const status = \\"success\\";")').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /copy code/i }).first()).toBeVisible();

    await context.close();
  });
});
