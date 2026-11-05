import { test, expect } from '@playwright/test';

test.describe('F-001: User Authentication', () => {
  const uniqueId = Date.now();
  const testUser = {
    email: `engineer_${uniqueId}@bccteams.local`,
    name: `Engineer ${uniqueId}`,
    password: 'Password123!',
    newPassword: 'NewPassword123!',
  };

  test('AC 5: Direct navigation to protected routes while unauthenticated redirects immediately to sign-in', async ({
    page,
  }) => {
    // Navigate directly to /chat without authentication
    await page.goto('/chat');
    // Expect URL to be redirected to /signin
    await expect(page).toHaveURL(/\/signin/);
    await expect(page.locator('h1')).toHaveText(/Sign In/i);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('AC 2: Submitting invalid email or short password displays inline validation errors', async ({
    page,
  }) => {
    await page.goto('/signup');
    await expect(page.locator('h1')).toHaveText('Create an account');

    // Enter invalid email and short password
    await page.getByLabel('Full name').fill('Test User');
    await page.getByLabel('Email address').fill('invalid-email-format');
    await page.getByLabel('Password').fill('12345');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Verify inline errors
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters long')).toBeVisible();

    // Form should NOT have submitted or navigated away
    await expect(page).toHaveURL(/\/signup/);
  });

  test('AC 1 & AC 4: A new user can register, lands in app shell, and can sign out', async ({
    page,
  }) => {
    await page.goto('/signup');

    await page.getByLabel('Full name').fill(testUser.name);
    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Should redirect to /chat
    await expect(page).toHaveURL(/\/chat/, { timeout: 10000 });

    // Verify top bar shows BCC Teams branding and user avatar button
    await expect(page.getByText('BCC Teams', { exact: true })).toBeVisible();
    const profileBtn = page.getByRole('button', { name: 'User Profile' });
    await expect(profileBtn).toBeVisible();

    // Test Sign Out (AC 4)
    await profileBtn.click();
    await expect(page.getByText(testUser.name)).toBeVisible();
    await page.getByRole('menuitem', { name: /Sign out/i }).click();

    // Should redirect back to /signin
    await expect(page).toHaveURL(/\/signin/);
  });

  test('AC 3: Incorrect password on sign-in displays authentication failure error', async ({
    page,
  }) => {
    await page.goto('/signin');

    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password').fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Expect error message
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });

  test('AC 6: Password reset generates secure token and setting new password works', async ({
    page,
  }) => {
    // 1. Go to forgot password
    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toHaveText('Reset Password');

    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    // Wait for success message & test reset link
    await expect(page.getByText(/password reset link has been sent/i)).toBeVisible();
    const testLink = page.getByText('Click here to set a new password');
    await expect(testLink).toBeVisible();
    await testLink.click();

    // Should be on /reset-password?token=...
    await expect(page).toHaveURL(/\/reset-password\?token=/);
    await expect(page.locator('h1')).toHaveText('Set New Password');

    // 2. Set new password
    await page.getByPlaceholder('Enter new password').fill(testUser.newPassword);
    await page.getByPlaceholder('Confirm new password').fill(testUser.newPassword);
    await page.getByRole('button', { name: 'Update Password' }).click();

    // Should see success message or auto-redirect to sign-in
    await expect(page.getByText(/Password has been reset successfully/i)).toBeVisible({ timeout: 15000 });

    // 3. Return to sign in with new password (either via button or redirect)
    await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });

    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.newPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should log in and land on /chat
    await expect(page).toHaveURL(/\/chat/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: 'User Profile' })).toBeVisible();
  });
});
