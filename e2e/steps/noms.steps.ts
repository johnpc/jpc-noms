import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

Given('a visitor opens the noms page', async ({ page }) => {
  await page.goto('/noms');
});

Then('they are prompted to sign in to nominate', async ({ page }) => {
  await expect(page.getByTestId('noms-signin')).toBeVisible();
});

// `the test user signs in` is defined in search.steps.ts (shared step).

When('the test user opens the noms page', async ({ page }) => {
  await page.goto('/noms');
});

Then('a shared nom is listed', async ({ page }) => {
  await expect(page.getByTestId('nom-row').first()).toBeVisible({ timeout: 20_000 });
});

When('the test user opens the first nom', async ({ page }) => {
  // The open (not-yet-selected) seeded nom shows an "option" count, not "Selected".
  await page.getByTestId('nom-row').filter({ hasText: 'option' }).first().click();
});

Then('a restaurant option is shown', async ({ page }) => {
  // Options render collapsed (name-only) by default; the row is enough of a read.
  await expect(page.getByTestId('nom-options').getByTestId('nom-option').first()).toBeVisible({
    timeout: 20_000,
  });
});

When('the test user selects the first option', async ({ page }) => {
  // Expand the collapsed option, then select it.
  await page.getByTestId('nom-options').getByTestId('nom-option').first().click();
  await page.getByTestId('nom-options').getByTestId('place-card-action').first().click();
});

Then('the nom shows it is selected', async ({ page }) => {
  await expect(page.getByTestId('nom-selected')).toBeVisible({ timeout: 20_000 });
});

Then('the start-a-nom control is available', async ({ page }) => {
  await expect(page.getByTestId('noms-create-btn')).toBeVisible({ timeout: 20_000 });
});
