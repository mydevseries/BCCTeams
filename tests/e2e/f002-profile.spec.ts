import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('F-002: User Profile System', () => {
  const samplePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  test.beforeAll(() => {
    // Write sample test avatar file
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(fixturesDir, 'test-avatar.png'),
      Buffer.from(samplePngBase64, 'base64')
    );
  });

  test('AC 1 & AC 2: User can view and edit their profile with immediate persistence', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `profile_edit_${timestamp}@bccteams.local`,
      name: `Alex Vance ${timestamp}`,
      password: 'Password123!',
      jobTitle: 'Principal Lead Architect',
      department: 'Cloud Platform Engineering',
      phoneNumber: '+1-555-0188',
    };

    // 1. Sign up user
    await page.goto('/signup');
    await page.getByLabel('Full name').fill(testUser.name);
    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL(/\/chat/);

    // 2. Open User Profile modal
    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('menuitem', { name: /Edit profile/i }).click();

    // Verify modal elements (AC 1)
    await expect(page.getByText('Your Profile')).toBeVisible();
    await expect(page.getByLabel('Display Name')).toHaveValue(testUser.name);
    await expect(page.getByLabel('Email Address')).toHaveValue(testUser.email);

    // 3. Edit profile fields (AC 2)
    const updatedName = `${testUser.name} Edited`;
    await page.getByLabel('Display Name').fill(updatedName);
    await page.getByLabel('Job Title').fill(testUser.jobTitle);
    await page.getByLabel('Department').fill(testUser.department);
    await page.getByLabel('Phone Number').fill(testUser.phoneNumber);

    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Wait for modal to close automatically after saving
    await expect(page.getByText('Your Profile')).not.toBeVisible({ timeout: 10000 });

    // 4. Verify immediate persistence after page reload (AC 2)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open profile modal again to verify values persisted in database
    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('menuitem', { name: /Edit profile/i }).click();

    await expect(page.getByLabel('Display Name')).toHaveValue(updatedName);
    await expect(page.getByLabel('Job Title')).toHaveValue(testUser.jobTitle);
    await expect(page.getByLabel('Department')).toHaveValue(testUser.department);
    await expect(page.getByLabel('Phone Number')).toHaveValue(testUser.phoneNumber);
  });

  test('AC 3 & AC 4: User can upload avatar photo and remove it to revert to initials', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const avatarUser = {
      email: `avatar_user_${timestamp}@bccteams.local`,
      name: `Photo Tester ${timestamp}`,
      password: 'Password123!',
    };

    // Sign up
    await page.goto('/signup');
    await page.getByLabel('Full name').fill(avatarUser.name);
    await page.getByLabel('Email address').fill(avatarUser.email);
    await page.getByLabel('Password').fill(avatarUser.password);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL(/\/chat/);

    // Open profile modal
    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('menuitem', { name: /Edit profile/i }).click();
    await expect(page.getByText('Your Profile')).toBeVisible();

    // Upload custom photo (AC 3)
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'test-avatar.png');
    await page.setInputFiles('input[type="file"]', fixturePath);

    // Verify "Remove" button appears for custom photo
    const removeBtn = page.getByRole('button', { name: 'Remove' });
    await expect(removeBtn).toBeVisible({ timeout: 10000 });

    // Remove custom photo (AC 4)
    await removeBtn.click();
    await expect(page.getByText('Profile photo removed, reverted to initials')).toBeVisible();

    // Verify "Remove" button is gone after removing photo
    await expect(removeBtn).not.toBeVisible();
  });

  test('AC 5: Viewing another member profile displays contact info, department, local time, and presence', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const colleagueEmail = `colleague_${timestamp}@bccteams.local`;
    const regRes = await request.post('/api/auth/register', {
      data: {
        email: colleagueEmail,
        password: 'Password123!',
        displayName: 'Dr. Gordon Freeman',
      },
    });
    expect(regRes.ok()).toBeTruthy();
    const colleagueData = await regRes.json();
    const colleagueId = colleagueData.user.id;
    const colleagueToken = colleagueData.tokens.accessToken;

    // Update colleague profile with department, job title, phone
    const patchRes = await request.patch('/api/users/me', {
      headers: { Authorization: `Bearer ${colleagueToken}` },
      data: {
        jobTitle: 'Research Scientist',
        department: 'Theoretical Physics',
        phoneNumber: '+1-555-0199',
      },
    });
    expect(patchRes.ok()).toBeTruthy();

    // Fetch colleague profile card endpoint as authenticated user
    const profileRes = await request.get(`/api/users/${colleagueId}`, {
      headers: { Authorization: `Bearer ${colleagueToken}` },
    });
    expect(profileRes.ok()).toBeTruthy();
    const profile = await profileRes.json();

    // Verify AC 5 attributes:
    expect(profile.displayName).toBe('Dr. Gordon Freeman');
    expect(profile.jobTitle).toBe('Research Scientist');
    expect(profile.department).toBe('Theoretical Physics');
    expect(profile.phoneNumber).toBe('+1-555-0199');
    expect(profile.presence).toBeDefined();
    expect(profile.presence.status).toBe('AVAILABLE');
    expect(profile.localTime).toBeDefined();
  });
});
