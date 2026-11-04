import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

test.describe('F-003: Organization Directory', () => {
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

  const activeUserA = {
    email: `a_archer_${timestamp}@bccteams.local`,
    name: `Alice Archer ${timestamp}`,
    password: 'Password123!',
    jobTitle: `Cryptographer ${timestamp}`,
    department: `CyberSec ${timestamp}`,
  };

  const activeUserZ = {
    email: `z_zimmerman_${timestamp}@bccteams.local`,
    name: `Zachary Zimmerman ${timestamp}`,
    password: 'Password123!',
    jobTitle: `InfraEngineer ${timestamp}`,
    department: `DevOps ${timestamp}`,
  };

  const inactiveUser = {
    email: `inactive_${timestamp}@bccteams.local`,
    name: `Inactive Ian ${timestamp}`,
    password: 'Password123!',
    jobTitle: 'Former Contractor',
    department: 'Legacy Systems',
  };

  test.beforeAll(async ({ request }) => {
    // 1. Create active User A
    const resA = await request.post('/api/auth/register', {
      data: {
        email: activeUserA.email,
        displayName: activeUserA.name,
        password: activeUserA.password,
      },
    });
    expect(resA.ok()).toBeTruthy();
    const tokenA = (await resA.json()).tokens.accessToken;
    await request.patch('/api/users/me', {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: {
        jobTitle: activeUserA.jobTitle,
        department: activeUserA.department,
        phoneNumber: '+1-555-0111',
      },
    });

    // 2. Create active User Z
    const resZ = await request.post('/api/auth/register', {
      data: {
        email: activeUserZ.email,
        displayName: activeUserZ.name,
        password: activeUserZ.password,
      },
    });
    expect(resZ.ok()).toBeTruthy();
    const tokenZ = (await resZ.json()).tokens.accessToken;
    await request.patch('/api/users/me', {
      headers: { Authorization: `Bearer ${tokenZ}` },
      data: {
        jobTitle: activeUserZ.jobTitle,
        department: activeUserZ.department,
        phoneNumber: '+1-555-0999',
      },
    });

    // 3. Create Inactive User and set isActive = false in DB
    const resIn = await request.post('/api/auth/register', {
      data: {
        email: inactiveUser.email,
        displayName: inactiveUser.name,
        password: inactiveUser.password,
      },
    });
    expect(resIn.ok()).toBeTruthy();
    await prisma.user.update({
      where: { email: inactiveUser.email },
      data: {
        isActive: false,
        jobTitle: inactiveUser.jobTitle,
        department: inactiveUser.department,
      },
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  // Helper to sign in and reach the Directory view reliably
  async function signInAndGoToDirectory(page: any) {
    await page.goto('/signin');
    await page.getByLabel('Email address').fill(activeUserA.email);
    await page.getByLabel('Password').fill(activeUserA.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/chat/);

    await page.getByRole('button', { name: /^Directory$/i }).click();
    await expect(page).toHaveURL(/\/directory/);
    await expect(page.locator('h1')).toHaveText('Organization Directory');
  }

  test('AC 1 & AC 4: Directory lists active users alphabetically and excludes inactive accounts', async ({
    page,
  }) => {
    await signInAndGoToDirectory(page);

    // 1. Verify directory loaded and active members badge is shown
    await expect(page.getByText(/members/i)).toBeVisible();
    await page.screenshot({ path: 'assets/screenshots/f003-directory.png' });

    // 2. Verify all user display names on the current page are strictly in alphabetical order
    const memberCards = page.locator('[role="button"][aria-label^="Member: "]');
    const count = await memberCards.count();
    expect(count).toBeGreaterThan(0);
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const label = await memberCards.nth(i).getAttribute('aria-label');
      if (label) names.push(label.replace(/^Member:\s*/, '').trim());
    }
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sortedNames);

    // 3. Verify searching specifically for active User A brings up User A
    const searchInput = page.getByRole('textbox', { name: /Search directory/i });
    await searchInput.fill(activeUserA.name);
    await page.waitForTimeout(300); // debounce
    await expect(page.getByText(activeUserA.name)).toBeVisible();

    // 4. Verify Inactive user is excluded even when searching explicitly for their full name
    await searchInput.fill(inactiveUser.name);
    await page.waitForTimeout(300); // debounce
    await expect(page.getByText(inactiveUser.name)).not.toBeVisible();
    await expect(page.getByText(/No colleagues found/i)).toBeVisible();
  });

  test('AC 2: Real-time search filters users by name, job title, department, or email', async ({
    page,
  }) => {
    await signInAndGoToDirectory(page);

    const searchInput = page.getByRole('textbox', { name: /Search directory/i });
    await expect(searchInput).toBeVisible();

    // 1. Search by unique Job Title
    await searchInput.fill(activeUserA.jobTitle);
    await page.waitForTimeout(300); // debounce
    await expect(page.getByText(activeUserA.name)).toBeVisible();
    await expect(page.getByText(activeUserZ.name)).not.toBeVisible();

    // 2. Clear and search by Department
    await searchInput.fill(activeUserZ.department);
    await page.waitForTimeout(300); // debounce
    await expect(page.getByText(activeUserZ.name)).toBeVisible();
    await expect(page.getByText(activeUserA.name)).not.toBeVisible();

    // 3. Search by exact email
    await searchInput.fill(activeUserA.email);
    await page.waitForTimeout(300); // debounce
    await expect(page.getByText(activeUserA.name)).toBeVisible();
    await expect(page.getByText(activeUserZ.name)).not.toBeVisible();

    // 4. Search by exact name of User Z
    await searchInput.fill(activeUserZ.name);
    await page.waitForTimeout(300); // debounce
    await expect(page.getByText(activeUserZ.name)).toBeVisible();
    await expect(page.getByText(activeUserA.name)).not.toBeVisible();
  });

  test('AC 3: Selecting a member card opens their profile card with action buttons', async ({
    page,
  }) => {
    await signInAndGoToDirectory(page);

    // Search specifically for User Z to display their card
    const searchInput = page.getByRole('textbox', { name: /Search directory/i });
    await searchInput.fill(activeUserZ.name);
    await page.waitForTimeout(300); // debounce

    // Click on User Z card
    const cardZ = page.getByRole('button', { name: `Member: ${activeUserZ.name}` });
    await expect(cardZ).toBeVisible();
    await cardZ.click();

    // Verify MemberProfileCard dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Member Profile')).toBeVisible();
    await expect(dialog.getByText(activeUserZ.email)).toBeVisible();
    await expect(dialog.getByText(activeUserZ.department)).toBeVisible();
    await expect(dialog.getByText(activeUserZ.jobTitle).first()).toBeVisible();

    // Verify quick action buttons (Chat, Call, Email)
    await expect(dialog.getByRole('button', { name: 'Chat' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Call' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Email' })).toBeVisible();

    // Take screenshot of member profile modal for documentation
    await page.screenshot({ path: 'assets/screenshots/f003-member-card.png' });
  });
});
