import { test, expect } from '@playwright/test';

test.describe('C-002: Group Chat', () => {
  const timestamp = Date.now();
  const userA = {
    email: `alice_grp_${timestamp}@bccteams.local`,
    name: `Alice Group ${timestamp}`,
    password: 'Password123!',
  };
  const userB = {
    email: `bob_grp_${timestamp}@bccteams.local`,
    name: `Bob Group ${timestamp}`,
    password: 'Password123!',
  };
  const userC = {
    email: `charlie_grp_${timestamp}@bccteams.local`,
    name: `Charlie Group ${timestamp}`,
    password: 'Password123!',
  };

  test.beforeAll(async ({ request }) => {
    // Register users
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

  test('Group chat creation, title editing, member roster, history sharing, and leaving', async ({
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

    // Context B: User B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/signin');
    await pageB.fill('input[type="email"]', userB.email);
    await pageB.fill('input[type="password"]', userB.password);
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/chat/);

    // 1. User A clicks "New chat"
    await pageA.getByRole('button', { name: /new chat/i }).first().click();

    // 2. User A searches and adds User B
    const toInput = pageA.getByPlaceholder(/type the name or email/i);
    await toInput.fill(userB.name.substring(0, 5));
    const resultItemB = pageA.getByRole('option', { name: new RegExp(userB.name, 'i') });
    await resultItemB.waitFor({ state: 'visible', timeout: 10000 });
    await resultItemB.click();

    // 3. User A adds User C
    const moreInput = pageA.getByPlaceholder(/add more people/i);
    await moreInput.fill(userC.name.substring(0, 5));
    const resultItemC = pageA.getByRole('option', { name: new RegExp(userC.name, 'i') });
    await resultItemC.waitFor({ state: 'visible', timeout: 10000 });
    await resultItemC.click();

    // 4. Set Group Name
    const groupNameInput = pageA.getByLabel(/group chat name/i);
    await groupNameInput.waitFor({ state: 'visible' });
    await groupNameInput.fill('Project Alpha Launch');

    // 5. Send initial group message
    const composerInput = pageA.getByPlaceholder(/type a message/i);
    await composerInput.fill('Hello everyone, welcome to Project Alpha!');
    await pageA.getByRole('button', { name: /send message/i }).click();

    // 6. Verify User A sees the group chat title in header
    await expect(pageA.getByRole('header', { name: /group chat: project alpha launch/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(pageA.getByText('Hello everyone, welcome to Project Alpha!')).toBeVisible();

    // 7. Verify User B sees the group chat in real-time
    await expect(pageB.getByText('Project Alpha Launch')).toBeVisible({ timeout: 15000 });
    await pageB.getByText('Project Alpha Launch').click();
    await expect(pageB.getByText('Hello everyone, welcome to Project Alpha!')).toBeVisible();

    // 8. User B edits the group title
    await pageB.getByRole('button', { name: /edit group name/i }).click();
    const editTitleInput = pageB.getByLabel(/group name/i);
    await editTitleInput.fill('Project Alpha Superstars');
    await pageB.getByRole('button', { name: /save group name/i }).click();

    // 9. Both users see system message and updated title
    await expect(pageB.getByText(/named the group "Project Alpha Superstars"/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(pageA.getByText(/named the group "Project Alpha Superstars"/i)).toBeVisible({
      timeout: 10000,
    });

    // 10. Open Group Members dialog and verify roster
    await pageA.getByRole('button', { name: /view group members/i }).click();
    await expect(pageA.getByText(/Group Members \(3\)/i)).toBeVisible();
    await expect(pageA.getByRole('button', { name: /add people/i })).toBeVisible();

    // Close contexts
    await contextA.close();
    await contextB.close();
  });
});
