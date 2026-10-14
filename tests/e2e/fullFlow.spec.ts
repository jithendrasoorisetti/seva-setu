import { test, expect } from '@playwright/test';

test.describe('SevaSetu Full Citizen Journey (English)', () => {
  test('types farmer profile, reviews facts, checks schemes, and downloads draft', async ({ page }) => {
    await page.goto('/');

    // 1. Switch to English first
    const enButton = page.getByRole('button', { name: 'Change language to English' });
    await enButton.click();

    // 2. Verify Header and Why This Matters Panel
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('Why this matters')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Describe Your Situation' })).toBeVisible();

    // 3. Enter farmer description in input textarea
    const textarea = page.locator('#situation-input');
    await textarea.fill(
      'I am a 56 year old farmer living in Guntur Andhra Pradesh with 2.5 acres of land and a white ration card.',
    );

    // 4. Click Submit
    const submitBtn = page.locator('#submit-situation-btn');
    await submitBtn.click();

    // 5. Verify Step 2 (Fact review & clarification) appears
    await expect(page.getByRole('heading', { name: 'Verify Extracted Facts' })).toBeVisible();
    await expect(page.getByText('56 years')).toBeVisible();
    await expect(page.getByText('FARMER')).toBeVisible();

    // 6. Confirm facts and advance to schemes
    const confirmBtn = page.locator('#confirm-facts-btn');
    await confirmBtn.click();

    // 7. Verify Step 3 (Scheme results) appears with Rythu Bharosa
    await expect(page.getByRole('heading', { name: 'Your Scheme Results' })).toBeVisible();
    const rythuCard = page.locator('#scheme-title-ap-ysr-rythu-bharosa');
    await expect(rythuCard).toBeVisible();

    // Check status chip
    await expect(page.getByText('Likely eligible').first()).toBeVisible();

    // Check official portal link and verification disclaimer
    await expect(page.getByText('Verify with the office before applying.').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /ysrrythubharosa\.ap\.gov\.in/i }).first()).toBeVisible();

    // 8. Open Scheme Detail Modal
    const viewBtn = page.locator('#view-scheme-btn-ap-ysr-rythu-bharosa');
    await viewBtn.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /YSR Rythu Bharosa/i })).toBeVisible();

    // Check document checklist inside modal
    await expect(modal.getByText('Required Documents Checklist')).toBeVisible();
    await expect(modal.getByText('Aadhaar Card').first()).toBeVisible();

    // 9. Download Draft Application
    const nameInput = modal.locator('#applicant-name');
    await nameInput.fill('Koteswara Rao');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    const downloadBtn = modal.locator('#download-draft-btn');
    await downloadBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sevasetu-draft-ap-ysr-rythu-bharosa.txt');

    // 10. Close Modal
    const closeBtn = modal.locator('#modal-close-btn');
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
