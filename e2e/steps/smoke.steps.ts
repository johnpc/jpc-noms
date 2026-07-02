import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, Then } = createBdd();

Given('a visitor opens the app at the root', async ({ page }) => {
  await page.goto('/');
});

Then('they are taken to the home shell', async ({ page }) => {
  await expect(page).toHaveURL(/\/home$/);
});

Then('a link to find a restaurant is visible', async ({ page }) => {
  await expect(page.getByTestId('home-search')).toBeVisible();
});

Then('a prompt to sign in to nominate is visible', async ({ page }) => {
  await expect(page.getByTestId('home-signin')).toBeVisible();
});
