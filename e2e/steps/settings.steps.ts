import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

Given('a visitor opens the settings page', async ({ page }) => {
  await page.goto('/settings');
});

When('they choose the dark theme', async ({ page }) => {
  await page.getByTestId('theme-dark').click();
});

When('they choose the light theme', async ({ page }) => {
  await page.getByTestId('theme-light').click();
});

Then('the app is in dark mode', async ({ page }) => {
  await expect(page.locator('html')).toHaveClass(/ion-palette-dark/);
});

Then('the app is in light mode', async ({ page }) => {
  await expect(page.locator('html')).not.toHaveClass(/ion-palette-dark/);
});
