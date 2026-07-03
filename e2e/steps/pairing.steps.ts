import { expect, test } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

const USERNAME = process.env.TEST_USERNAME;
const PASSWORD = process.env.TEST_PASSWORD;

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
  if (!USERNAME || !PASSWORD) test.skip(true, 'TEST_USERNAME / TEST_PASSWORD not set');
  await expect(page.getByTestId('pairing-invite')).toBeVisible({ timeout: 20_000 });
});
