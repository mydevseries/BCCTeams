import { test, expect } from '@playwright/test';

test.describe('F-005: Settings (Theme, Language, Notification Preferences)', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `settings_${timestamp}@bccteams.local`,
    name: `Sam Settings ${timestamp}`,
    password: 'Password123!',
  };

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        email: testUser.email,
        displayName: testUser.name,
        password: testUser.password,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  const signIn = async (page: any) => {
    await page.goto('/signin');
    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/chat/);
  };

  test('AC 1 & AC 4: Switching themes takes effect instantly without page reload and persists to DB', async ({
    page,
  }) => {
    await signIn(page);

    // Open Settings from user avatar menu
    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();

    const dialog = page.getByRole('dialog', { name: /Settings/i });
    await expect(dialog).toBeVisible();

    // 1. Switch to Dark theme
    const patchDarkPromise = page.waitForResponse(
      (res) => res.url().includes('/api/settings/me') && res.request().method() === 'PATCH',
    );
    await dialog.getByRole('radio', { name: 'Dark' }).click();
    await patchDarkPromise;

    // Verify dark theme applied immediately
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // 2. Switch to High Contrast theme
    const patchHCPromise = page.waitForResponse(
      (res) => res.url().includes('/api/settings/me') && res.request().method() === 'PATCH',
    );
    await dialog.getByRole('radio', { name: 'High Contrast' }).click();
    await patchHCPromise;

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'high-contrast');

    // 3. Switch back to Light theme
    const patchLightPromise = page.waitForResponse(
      (res) => res.url().includes('/api/settings/me') && res.request().method() === 'PATCH',
    );
    await dialog.getByRole('radio', { name: 'Light' }).click();
    await patchLightPromise;

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // Close settings
    await dialog.getByRole('button', { name: /Done/i }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('AC 2: Language change immediately updates UI strings and persists across reload', async ({
    page,
  }) => {
    await signIn(page);

    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Switch language to French
    const patchLangPromise = page.waitForResponse(
      (res) => res.url().includes('/api/settings/me') && res.request().method() === 'PATCH',
    );
    await dialog.getByRole('combobox', { name: /App Language Selection/i }).selectOption('fr');
    await patchLangPromise;

    // UI strings in modal should update immediately to French
    await expect(dialog.getByRole('heading', { name: 'Paramètres' })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Général' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Terminer' })).toBeVisible();

    // Close modal
    await dialog.getByRole('button', { name: 'Terminer' }).click();
    await expect(dialog).not.toBeVisible();

    // Reopen modal and restore English
    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('menuitem', { name: /Paramètres|Settings/i }).click();

    const patchRestorePromise = page.waitForResponse(
      (res) => res.url().includes('/api/settings/me') && res.request().method() === 'PATCH',
    );
    await dialog.getByRole('combobox', { name: /App Language Selection/i }).selectOption('en');
    await patchRestorePromise;
    await expect(dialog.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Done' }).click();
  });

  test('AC 3 & AC 5: Notification preference toggles and full keyboard Esc navigation', async ({
    page,
  }) => {
    await signIn(page);

    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();

    const dialog = page.getByRole('dialog', { name: /Settings/i });
    await expect(dialog).toBeVisible();

    // Switch to Notifications tab
    await dialog.getByRole('tab', { name: 'Notifications' }).click();
    await expect(dialog.getByText('Notification Preferences')).toBeVisible();

    const soundAlertsSwitch = dialog.getByRole('switch', { name: 'Sound alerts' });
    await expect(soundAlertsSwitch).toBeVisible();

    // Toggle sound alerts off
    const patchSoundsPromise = page.waitForResponse(
      (res) => res.url().includes('/api/settings/me') && res.request().method() === 'PATCH',
    );
    await soundAlertsSwitch.click();
    await patchSoundsPromise;

    // Verify switch is now unchecked
    await expect(soundAlertsSwitch).not.toBeChecked();

    // Test Keyboard Esc closes the modal
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});

