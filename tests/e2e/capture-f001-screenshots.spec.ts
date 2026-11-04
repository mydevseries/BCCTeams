import { test } from '@playwright/test';

test('Capture F-001 screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Sign In screen
  await page.goto('/signin');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'assets/screenshots/f001-signin.png' });

  // 2. Sign Up screen
  await page.goto('/signup');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'assets/screenshots/f001-signup.png' });

  // 3. Register and capture AppShell with authenticated user
  const email = `sarah.connor_${Date.now()}@bccteams.local`;
  await page.getByLabel('Full name').fill('Sarah Connor');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('EnterprisePassword2026!');
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await page.waitForURL(/\/chat/);
  await page.waitForLoadState('networkidle');

  // Open profile menu to show user details
  const profileBtn = page.getByRole('button', { name: 'User Profile' });
  await profileBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'assets/screenshots/f001-authenticated-appshell.png' });
});
