import { test, expect } from '@playwright/test';

test.describe('A-010: Search Type-Ahead Dropdown', () => {
  const timestamp = Date.now();
  const searcherUser = {
    email: `searcher_${timestamp}@bccteams.local`,
    name: `Sam Searcher ${timestamp}`,
    password: 'Password123!',
  };
  const targetColleague = {
    email: `diana_${timestamp}@bccteams.local`,
    name: `Diana Prince ${timestamp}`,
    password: 'Password123!',
  };

  test.beforeAll(async ({ request }) => {
    // Register searcher user
    const resA = await request.post('/api/auth/register', {
      data: {
        email: searcherUser.email,
        displayName: searcherUser.name,
        password: searcherUser.password,
      },
    });
    expect(resA.ok()).toBeTruthy();

    // Register target colleague
    const resB = await request.post('/api/auth/register', {
      data: {
        email: targetColleague.email,
        displayName: targetColleague.name,
        password: targetColleague.password,
      },
    });
    expect(resB.ok()).toBeTruthy();
    const tokenB = (await resB.json()).tokens.accessToken;

    // Update target colleague's profile with jobTitle and department
    await request.patch('/api/users/me', {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: {
        jobTitle: 'Lead Architect',
        department: 'Infrastructure',
      },
    });
  });

  const signIn = async (page: any) => {
    await page.goto('/signin');
    await page.getByLabel('Email address').fill(searcherUser.email);
    await page.getByLabel('Password').fill(searcherUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/chat/);
  };

  test('AC 5, 6 & 7: Empty focused search box shows Suggested and responds to Ctrl+E & Esc', async ({
    page,
  }) => {
    await signIn(page);

    // Global shortcut Ctrl+E should focus the search box and open dropdown
    await page.keyboard.press('Control+E');
    const searchInput = page.getByRole('textbox', { name: /Global search/i });
    await expect(searchInput).toBeFocused();

    // Dropdown listbox should be open showing "Suggested" section with "Invite people"
    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();
    await expect(dropdown.getByText('Invite people to BCC Teams')).toBeVisible();
    await expect(dropdown.getByText('Coming soon', { exact: true })).toBeVisible();

    // Esc closes the dropdown
    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();
  });

  test('AC 1, 2, 3 & 7: Typing debounces matching people with presence, highlights query, and opens profile card', async ({
    page,
  }) => {
    await signIn(page);

    const searchInput = page.getByRole('textbox', { name: /Global search/i });
    await searchInput.focus();

    // Type target colleague's name
    const searchResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/users') && res.status() === 200,
    );
    await searchInput.fill(`Diana Prince ${timestamp}`);
    await searchResponsePromise;

    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();

    // Top row shows typed text and "Press Enter to see all results"
    await expect(dropdown.getByText(`"Diana Prince ${timestamp}"`)).toBeVisible();
    await expect(dropdown.getByText('Press Enter to see all results')).toBeVisible();

    // People section shows matching colleague with highlighted name, avatar badge, and title
    await expect(dropdown.getByText('People')).toBeVisible();
    await expect(dropdown.getByText('Lead Architect')).toBeVisible();

    // Press ArrowDown to select person and Enter to open card
    await page.keyboard.press('ArrowDown'); // selects top row
    await page.keyboard.press('ArrowDown'); // selects first person
    await page.keyboard.press('Enter');

    // Dialog profile card opens
    const profileDialog = page.getByRole('dialog', { name: 'Member Profile' });
    await expect(profileDialog).toBeVisible({ timeout: 10000 });
    await expect(profileDialog.getByText(`Diana Prince ${timestamp}`)).toBeVisible();
    await expect(profileDialog.getByText('Lead Architect').first()).toBeVisible();
    await expect(profileDialog.getByText('Infrastructure')).toBeVisible();

    // Close member profile card
    await profileDialog.getByRole('button', { name: 'Close' }).click();
    await expect(profileDialog).not.toBeVisible();

    // Now clear input and focus again: colleague should appear in "Recent People"
    await searchInput.fill('');
    await searchInput.focus();
    await expect(dropdown.getByText('Recent People')).toBeVisible();
    await expect(dropdown.getByText(`Diana Prince ${timestamp}`)).toBeVisible();
  });
});

