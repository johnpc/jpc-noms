import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

Given('a visitor opens the partner page', async ({ page }) => {
  await page.goto('/partner');
});

Then('they are prompted to sign in to pair', async ({ page }) => {
  await expect(page.getByTestId('pairing-signin')).toBeVisible();
});

// `the test user signs in` is defined in search.steps.ts (shared step).

When('the test user opens the partner page', async ({ page }) => {
  await page.goto('/partner');
});

Then('they see the invite-a-partner form', async ({ page }) => {
  await expect(page.getByTestId('pairing-invite')).toBeVisible({ timeout: 20_000 });
});

Then('they see their pairing QR code', async ({ page }) => {
  await expect(page.getByTestId('pairing-qr')).toBeVisible({ timeout: 20_000 });
});

Then('a scan-partner-code button is available', async ({ page }) => {
  await expect(page.getByTestId('qr-scan-btn')).toBeVisible();
});
