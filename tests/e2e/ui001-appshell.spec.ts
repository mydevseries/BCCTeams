import { test, expect } from '@playwright/test';

test.describe('UI-001: App Shell Layout, Responsive Grids, and Theming', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `ui001_${timestamp}@bccteams.local`,
    name: `Elena Rostova ${timestamp}`,
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

  const viewports = [
    { width: 1920, height: 1080, name: '1920x1080' },
    { width: 1366, height: 768, name: '1366x768' },
  ];

  const sections = [
    { path: '/chat', name: 'chat', label: 'Chat' },
    { path: '/activity', name: 'activity', label: 'Activity' },
    { path: '/teams', name: 'teams', label: 'Teams' },
    { path: '/calendar', name: 'calendar', label: 'Calendar' },
    { path: '/calls', name: 'calls', label: 'Calls' },
    { path: '/files', name: 'files', label: 'Files' },
    { path: '/apps', name: 'apps', label: 'Apps' },
    { path: '/directory', name: 'directory', label: 'Directory' },
  ];

  for (const vp of viewports) {
    test.describe(`Viewport: ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test(`Full visual suite in Light and Dark mode at ${vp.name}`, async ({ page }) => {
        test.setTimeout(90000);

        // Sign in
        await page.goto('/signin');
        await page.getByLabel('Email address').fill(testUser.email);
        await page.getByLabel('Password').fill(testUser.password);
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL(/\/chat/);

        // Helper to check horizontal overflow and viewport boundaries
        const assertNoHorizontalOverflow = async () => {
          const overflow = await page.evaluate(() => {
            const doc = document.documentElement;
            const body = document.body;
            return {
              docScrollWidth: doc.scrollWidth,
              docClientWidth: doc.clientWidth,
              bodyScrollWidth: body.scrollWidth,
              bodyClientWidth: body.clientWidth,
              hasHorizontalScroll: doc.scrollWidth > doc.clientWidth || body.scrollWidth > body.clientWidth,
            };
          });
          expect(overflow.hasHorizontalScroll).toBeFalsy();
        };

        // Helper to switch theme via Settings modal
        const setTheme = async (mode: 'light' | 'dark') => {
          await page.getByRole('button', { name: 'User Profile' }).click();
          await page.getByRole('menuitem', { name: 'Settings' }).click();
          const dialog = page.getByRole('dialog', { name: 'Application Settings' });
          await expect(dialog).toBeVisible();
          if (mode === 'dark') {
            await dialog.getByRole('radio', { name: 'Dark' }).click();
          } else {
            await dialog.getByRole('radio', { name: 'Light' }).click();
          }
          await dialog.getByRole('button', { name: 'Done' }).click();
          await expect(dialog).not.toBeVisible();
        };

        const nav = page.getByRole('navigation', { name: 'Main Navigation' });

        // 1. LIGHT MODE TEST FOR ALL SECTIONS
        await setTheme('light');

        for (const sec of sections) {
          if (sec.path !== '/directory') {
            await nav.getByRole('button', { name: new RegExp(`^${sec.label}$`, 'i') }).click();
          } else {
            await page.goto('/directory');
          }
          await expect(page).toHaveURL(new RegExp(sec.path));

          // Check top right avatar is strictly visible and not cut off
          const avatarBtn = page.getByRole('button', { name: 'User Profile' });
          await expect(avatarBtn).toBeVisible();
          const avatarBox = await avatarBtn.boundingBox();
          expect(avatarBox).not.toBeNull();
          if (avatarBox) {
            expect(avatarBox.x + avatarBox.width).toBeLessThanOrEqual(vp.width);
          }

          // Verify zero horizontal scroll
          await assertNoHorizontalOverflow();

          // Screenshot light mode
          await page.screenshot({
            path: `assets/screenshots/ui001/${sec.name}-light-${vp.name}.png`,
          });
        }

        // 2. DARK MODE TEST FOR ALL SECTIONS
        await setTheme('dark');

        // Check dark mode background is NOT white
        const darkBg = await page.evaluate(() => {
          const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          return { htmlBg, bodyBg };
        });
        expect(darkBg.htmlBg).not.toBe('rgb(255, 255, 255)');
        expect(darkBg.bodyBg).not.toBe('rgb(255, 255, 255)');

        for (const sec of sections) {
          if (sec.path !== '/directory') {
            await nav.getByRole('button', { name: new RegExp(`^${sec.label}$`, 'i') }).click();
          } else {
            await page.goto('/directory');
          }
          await expect(page).toHaveURL(new RegExp(sec.path));

          // Check top right avatar is visible
          const avatarBtn = page.getByRole('button', { name: 'User Profile' });
          await expect(avatarBtn).toBeVisible();
          const avatarBox = await avatarBtn.boundingBox();
          expect(avatarBox).not.toBeNull();
          if (avatarBox) {
            expect(avatarBox.x + avatarBox.width).toBeLessThanOrEqual(vp.width);
          }

          // Verify zero horizontal scroll
          await assertNoHorizontalOverflow();

          // Screenshot dark mode
          await page.screenshot({
            path: `assets/screenshots/ui001/${sec.name}-dark-${vp.name}.png`,
          });
        }

        // 3. CAPTURE SETTINGS MODAL AND AVATAR MENU IN DARK MODE
        await page.getByRole('button', { name: 'User Profile' }).click();
        await page.screenshot({
          path: `assets/screenshots/ui001/avatar-menu-dark-${vp.name}.png`,
        });

        await page.getByRole('menuitem', { name: 'Settings' }).click();
        const settingsDialog = page.getByRole('dialog', { name: 'Application Settings' });
        await expect(settingsDialog).toBeVisible();
        await page.screenshot({
          path: `assets/screenshots/ui001/settings-modal-dark-${vp.name}.png`,
        });
        await settingsDialog.getByRole('button', { name: 'Done' }).click();
      });
    });
  }
});
