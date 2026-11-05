import { test, expect } from '@playwright/test';

test.describe('C-003: Chat List Management', () => {
  const timestamp = Date.now();
  const userA = {
    email: `alice_list_${timestamp}@bccteams.local`,
    name: `Alice List ${timestamp}`,
    password: 'Password123!',
  };
  const userB = {
    email: `bob_list_${timestamp}@bccteams.local`,
    name: `Bob List ${timestamp}`,
    password: 'Password123!',
  };
  const userC = {
    email: `charlie_list_${timestamp}@bccteams.local`,
    name: `Charlie List ${timestamp}`,
    password: 'Password123!',
  };

  test.beforeAll(async ({ request }) => {
    for (const u of [userA, userB, userC]) {
      const res = await request.post('/api/auth/register', {
        data: {
          email: u.email,
          displayName: u.name,
          password: u.password,
        },
      });
      expect(res.ok()).toBeTruthy();
    }
  });

  test('AC 1 to AC 6: unread count badge, pin/unpin sections, mute, hide/unhide, and mark as unread', async ({
    browser,
  }) => {
    test.setTimeout(90000);

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/signin');
    await pageA.fill('input[type="email"]', userA.email);
    await pageA.fill('input[type="password"]', userA.password);
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/chat/);

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/signin');
    await pageB.fill('input[type="email"]', userB.email);
    await pageB.fill('input[type="password"]', userB.password);
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/chat/);

    // 1. User A starts chat with User B and sends a message
    await pageA.getByRole('button', { name: /new chat/i }).first().click();
    const toInput = pageA.getByPlaceholder(/type the name or email/i);
    await toInput.fill(userB.name.substring(0, 5));
    const resultItemB = pageA.getByRole('option', { name: new RegExp(userB.name, 'i') });
    await resultItemB.waitFor({ state: 'visible', timeout: 10000 });
    await resultItemB.click();

    await pageA.getByPlaceholder(/type a message/i).fill('First direct message from Alice');
    await pageA.getByRole('button', { name: /send message/i }).click();

    // 2. User B sees unread badge and bold title
    await expect(pageB.getByText(userA.name)).toBeVisible({ timeout: 15000 });
    await expect(pageB.getByLabelText(/unread/i)).toBeVisible();

    // 3. User A pins the chat
    const optionsBtnA = pageA.getByRole('button', { name: new RegExp(`options for ${userB.name}`, 'i') });
    await optionsBtnA.click();
    await pageA.getByRole('menuitem', { name: /^pin$/i }).click();

    // 4. Verify chat appears under PINNED section
    await expect(pageA.getByText(/PINNED \(1\)/i)).toBeVisible({ timeout: 10000 });
    await expect(pageA.getByLabelText('Pinned')).toBeVisible();

    // 5. User A mutes the chat
    await optionsBtnA.click();
    await pageA.getByRole('menuitem', { name: /^mute$/i }).click();
    await expect(pageA.getByLabelText('Muted')).toBeVisible();

    // 6. User B clicks the conversation to mark it as read
    await pageB.getByText(userA.name).click();
    await expect(pageB.getByText('First direct message from Alice')).toBeVisible();

    // 7. User B marks as unread via options menu
    const optionsBtnB = pageB.getByRole('button', { name: new RegExp(`options for ${userA.name}`, 'i') });
    await optionsBtnB.click();
    await pageB.getByRole('menuitem', { name: /mark as unread/i }).click();
    await expect(pageB.getByLabelText(/unread/i)).toBeVisible({ timeout: 10000 });

    // 8. User B hides the chat
    await optionsBtnB.click();
    await pageB.getByRole('menuitem', { name: /^hide$/i }).click();
    await expect(pageB.getByText(userA.name)).not.toBeVisible({ timeout: 10000 });

    // 9. User A sends another message -> chat automatically unhides for User B
    await pageA.getByPlaceholder(/type a message/i).fill('Second message, should unhide!');
    await pageA.getByRole('button', { name: /send message/i }).click();

    await expect(pageB.getByText(userA.name)).toBeVisible({ timeout: 15000 });

    await contextA.close();
    await contextB.close();
  });
});

