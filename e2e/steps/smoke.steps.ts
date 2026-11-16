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

// Which backend the build talks to is announced on <html data-backend> by the
// ONE module that configures it (src/lib/amplify.ts, or the fake shim). A fake
// run that silently reached the real cloud — or the reverse — fails here.
Then('the app announces the backend this run expects', async ({ page }) => {
  const expected = process.env.FAKE_BACKEND === '1' ? 'fake' : 'amplify';
  await expect(page.locator('html')).toHaveAttribute('data-backend', expected);
});
