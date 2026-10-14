import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('SevaSetu Citizen & Volunteer Login Journey', () => {
  test('navigates to login page and passes axe accessibility audit', async ({ page }) => {
    await page.goto('/login');

    // Switch to English
    const enBtn = page.getByRole('button', { name: 'Change language to English' });
    await enBtn.click();

    // Verify title and landmarks
    await expect(page.getByRole('heading', { name: /Login to SevaSetu/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Citizen Login/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Grama Sachivalayam Volunteer/i })).toBeVisible();

    // Run Axe-core WCAG 2.2 AA audit on Login Page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(criticalOrSerious).toEqual([]);
  });

  test('performs 1-click demo citizen login and returns to home with active session', async ({ page }) => {
    await page.goto('/');

    // Click header login link
    const loginLink = page.locator('#header-login-link');
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    await expect(page).toHaveURL(/.*\/login/);

    // Click 1-click Demo Citizen button
    const demoBtn = page.locator('#demo-citizen-btn');
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Wait for redirect to home page
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Verify logged-in state in header
    await expect(page.getByText('R. Ramanjaneyulu')).toBeVisible();

    // Logout
    const logoutBtn = page.getByRole('button', { name: /లాగ్ అవుట్|Logout/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify login button reappears
    await expect(page.locator('#header-login-link')).toBeVisible();
  });
});
