import { test, expect } from '@playwright/test';

test.describe('SevaSetu Full Citizen Journey (Telugu - తెలుగు)', () => {
  test('uses Telugu vernacular interface end-to-end', async ({ page }) => {
    await page.goto('/');

    // 1. Verify Telugu Branding & Default UI
    await expect(page.locator('h1')).toContainText('సేవాసేతు');
    await expect(page.getByText('ఇది ఎందుకు ముఖ్యం?')).toBeVisible();

    // 2. Select Quick Test Profile in Telugu for Farmer
    const farmerQuickBtn = page.getByRole('button', { name: /Small Farmer/i });
    await farmerQuickBtn.click();

    // Verify textarea populated with Telugu text
    const textarea = page.locator('#situation-input');
    await expect(textarea).toHaveValue(/రైతును/);

    // 3. Submit in Telugu
    const submitBtn = page.locator('#submit-situation-btn');
    await submitBtn.click();

    // 4. Step 2 in Telugu (వివరాల పరిశీలన)
    await expect(page.getByRole('heading', { name: 'వివరాల పరిశీలన' })).toBeVisible();

    // 5. Confirm facts
    const confirmBtn = page.locator('#confirm-facts-btn');
    await confirmBtn.click();

    // 6. Step 3 (మీ పథకాల ఫలితాలు)
    await expect(page.getByRole('heading', { name: 'మీ పథకాల ఫలితాలు' })).toBeVisible();
    await expect(page.getByText('వైఎస్సార్ రైతు భరోసా')).toBeVisible();
    await expect(page.getByText('అర్హత ఉండే అవకాశం ఎక్కువ').first()).toBeVisible();

    // 7. Verify official link in card
    await expect(page.getByRole('link', { name: /ysrrythubharosa\.ap\.gov\.in/i }).first()).toBeVisible();
  });
});
