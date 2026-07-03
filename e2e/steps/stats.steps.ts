import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

Given('a visitor opens the stats page', async ({ page }) => {
  await page.goto('/stats');
});

Then('they are prompted to sign in for stats', async ({ page }) => {
  await expect(page.getByTestId('stats-signin')).toBeVisible();
});

// `the test user signs in` is defined in search.steps.ts (shared step).

When('the test user opens the stats page', async ({ page }) => {
  await page.goto('/stats');
});

Then('the winning restaurant {string} is shown', async ({ page }, name: string) => {
  await expect(page.getByTestId('history-row').filter({ hasText: name })).toBeVisible({
    timeout: 20_000,
  });
});
