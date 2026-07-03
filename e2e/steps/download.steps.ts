import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, Then } = createBdd();

Given('a visitor opens the download page', async ({ page }) => {
  await page.goto('/download');
});

Then('a TestFlight beta link is shown', async ({ page }) => {
  const link = page.getByTestId('download-testflight');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', /testflight\.apple\.com\/join\//);
});
