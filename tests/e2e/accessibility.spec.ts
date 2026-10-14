import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.2 AA Accessibility Audits (Axe-Core)', () => {
  test('home page passes axe audit with 0 serious or critical violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(criticalOrSerious).toEqual([]);
  });

  test('scheme results grid and modal pass axe accessibility audit', async ({ page }) => {
    await page.goto('/');

    // Quick fill
    const farmerQuickBtn = page.getByRole('button', { name: /Small Farmer/i });
    await farmerQuickBtn.click();
    await page.locator('#submit-situation-btn').click();

    // Confirm facts
    const confirmBtn = page.locator('#confirm-facts-btn');
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });

    // Audit Step 2
    const step2Scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const step2Violations = step2Scan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(step2Violations).toEqual([]);

    await confirmBtn.click();

    // Audit Step 3
    await expect(page.locator('#scheme-title-ap-ysr-rythu-bharosa')).toBeVisible();
    const step3Scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const step3Violations = step3Scan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(step3Violations).toEqual([]);

    // Open Modal and Audit Modal
    await page.locator('#view-scheme-btn-ap-ysr-rythu-bharosa').click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const modalScan = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const modalViolations = modalScan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(modalViolations).toEqual([]);
  });
});
