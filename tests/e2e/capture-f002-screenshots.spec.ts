import { test } from '@playwright/test';

test('Capture F-002 profile screenshots', async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  const timestamp = Date.now();
  const email = `elena.rostova_${timestamp}@bccteams.local`;

  // 1. Register and sign in
  await page.goto('/signup');
  await page.getByLabel('Full name').fill('Elena Rostova');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('Enterprise2026!');
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await page.waitForURL(/\/chat/);

  // 2. Open Profile modal and fill details
  await page.getByRole('button', { name: 'User Profile' }).click();
  await page.getByRole('menuitem', { name: /Edit profile/i }).click();
  await page.getByLabel('Job Title').fill('Lead Distributed Systems Engineer');
  await page.getByLabel('Department').fill('Core Infrastructure');
  await page.getByLabel('Phone Number').fill('+1 (555) 014-9922');

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'assets/screenshots/f002-profile-modal.png' });

  // Save changes
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.waitForTimeout(1500);

  // 3. Capture authenticated AppShell with updated profile initials in menu
  await page.getByRole('button', { name: 'User Profile' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'assets/screenshots/f002-profile-saved.png' });
});
