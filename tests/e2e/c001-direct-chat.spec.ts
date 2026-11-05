import { test, expect } from '@playwright/test';

test.describe('C-001: 1:1 Direct Chat', () => {
  const timestamp = Date.now();
  const userA = {
    email: `alice_chat_${timestamp}@bccteams.local`,
    name: `Alice Walker ${timestamp}`,
    password: 'Password123!',
  };
  const userB = {
    email: `bob_chat_${timestamp}@bccteams.local`,
    name: `Bob Builder ${timestamp}`,
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

  test('AC 1, AC 2, AC 3 & AC 4: 1:1 Direct Chat lifecycle across two real-time browser sessions', async ({
    browser,
  }) => {
    test.setTimeout(90000);

    // Context A: User A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/signin');
    await pageA.fill('input[type="email"]', userA.email);
    await pageA.fill('input[type="password"]', userA.password);
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/chat/);
    await pageA.waitForLoadState('networkidle');

    // Context B: User B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/signin');
    await pageB.fill('input[type="email"]', userB.email);
    await pageB.fill('input[type="password"]', userB.password);
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/chat/);
    await pageB.waitForLoadState('networkidle');

    // --- AC 1: Clicking "New Chat" opens recipient picker with autocomplete ---
    // User A clicks "New Chat" button or Compose button
    const newChatBtn = pageA.getByRole('button', { name: /new chat/i });
    if (await newChatBtn.isVisible()) {
      await newChatBtn.click();
    } else {
      await pageA.getByRole('button', { name: /new conversation/i }).click();
    }

    // Verify recipient picker is displayed with "To:"
    await expect(pageA.getByText('To:')).toBeVisible();
    const recipientInput = pageA.getByPlaceholder(/type the name or email/i);
    await expect(recipientInput).toBeVisible();

    // Type User B's name into recipient picker
    await recipientInput.fill(userB.name.substring(0, 5));

    // Autocomplete dropdown option for User B appears
    const optionB = pageA.getByRole('option', { name: new RegExp(userB.name, 'i') });
    await expect(optionB).toBeVisible({ timeout: 10000 });

    // --- AC 2: Selecting user initializes draft conversation ---
    await optionB.click();

    // Verify draft intro state
    await expect(pageA.getByText(new RegExp(`start of your 1:1 conversation history with ${userB.name}`, 'i'))).toBeVisible();

    // --- AC 3: Sending first message creates conversation and adds to both chat lists ---
    const composer = pageA.getByPlaceholder(/type a new message/i);
    await expect(composer).toBeVisible();
    await composer.fill('Hello Bob! Welcome to BCC Teams.');
    await composer.press('Enter');

    // Message appears in User A's thread
    await expect(pageA.getByText('Hello Bob! Welcome to BCC Teams.')).toBeVisible();

    // Conversation appears in User A's left list pane
    const listPaneA = pageA.getByRole('list', { name: /conversations list/i });
    await expect(listPaneA.getByText(userB.name)).toBeVisible();

    // In Context B: Conversation appears in User B's left list pane with message preview
    await expect(pageB.getByRole('list', { name: /conversations list/i }).getByText(userA.name)).toBeVisible({ timeout: 15000 });
    await expect(pageB.getByText('Hello Bob! Welcome to BCC Teams.')).toBeVisible();

    // --- AC 4: 1:1 chat header displays participant full name, presence, and quick call buttons ---
    // User B clicks the conversation in their list pane
    await pageB.getByRole('list', { name: /conversations list/i }).getByText(userA.name).click();

    // Check header in User B's main pane
    const headerB = pageB.getByRole('banner', { name: new RegExp(`Chat with ${userA.name}`, 'i') });
    await expect(headerB).toBeVisible();
    await expect(headerB.getByText(userA.name)).toBeVisible();
    await expect(headerB.getByRole('button', { name: /audio call/i })).toBeVisible();
    await expect(headerB.getByRole('button', { name: /video call/i })).toBeVisible();

    // User B replies back
    const composerB = pageB.getByPlaceholder(/type a new message/i);
    await composerB.fill('Hi Alice! Glad to be here.');
    await composerB.press('Enter');

    // Reply appears in User A's screen in real time
    await expect(pageA.getByText('Hi Alice! Glad to be here.')).toBeVisible({ timeout: 10000 });

    // --- AC 2 (Existing conversation): Selecting User B again opens existing history ---
    await pageA.getByRole('button', { name: /new conversation/i }).click();
    await pageA.getByPlaceholder(/type the name or email/i).fill(userB.name.substring(0, 5));
    const optionAgain = pageA.getByRole('option', { name: new RegExp(userB.name, 'i') });
    await expect(optionAgain).toBeVisible({ timeout: 10000 });
    await optionAgain.click();

    // Existing history with both messages is displayed
    await expect(pageA.getByText('Hello Bob! Welcome to BCC Teams.')).toBeVisible();
    await expect(pageA.getByText('Hi Alice! Glad to be here.')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
