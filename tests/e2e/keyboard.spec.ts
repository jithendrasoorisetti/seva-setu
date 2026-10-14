import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation Accessibility', () => {
  test('navigates the entire interface using only keyboard', async ({ page }) => {
    await page.goto('/');

    // 1. Focus first interactive element (Language switcher)
    const firstLangBtn = page.getByRole('button', { name: 'Change language to Telugu' });
    await firstLangBtn.focus();
    await expect(firstLangBtn).toBeFocused();

    await page.keyboard.press('Tab'); // Language button 2 (English)
    await page.keyboard.press('Tab'); // Language button 3 (Hindi)
    await page.keyboard.press('Tab'); // Header Login button
    await page.keyboard.press('Tab'); // Voice button
    await expect(page.locator('#voice-input-btn')).toBeFocused();

    // Tab to quick sample profile button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Activates quick profile

    // Textarea now has content
    const textarea = page.locator('#situation-input');
    await expect(textarea).not.toHaveValue('');

    // Tab into textarea
    await page.keyboard.press('Tab'); // other quick buttons or textarea
    await textarea.focus();

    // Tab to submit button
    const submitBtn = page.locator('#submit-situation-btn');
    await submitBtn.focus();
    await page.keyboard.press('Enter');

    // 2. In Step 2, focus confirm button and press Enter
    const confirmBtn = page.locator('#confirm-facts-btn');
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.focus();
    await page.keyboard.press('Enter');

    // 3. In Step 3, focus first scheme card and open modal
    const viewBtn = page.locator('button[id^="view-scheme-btn-"]').first();
    await expect(viewBtn).toBeVisible();
    await viewBtn.focus();
    await page.keyboard.press('Enter');

    // 4. Modal is open
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 5. Press Escape to close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
