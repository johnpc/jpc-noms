import { expect, test } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

const USERNAME = process.env.TEST_USERNAME;
const PASSWORD = process.env.TEST_PASSWORD;

Given('a visitor opens the search page', async ({ page }) => {
  await page.goto('/search');
});

When('they search for {string}', async ({ page }, term: string) => {
  await page.getByTestId('search-input').locator('input').fill(term);
  // Wait out the searchbar debounce + the query.
  await expect(page.getByTestId('place-card').first()).toBeVisible({ timeout: 20_000 });
});

Then('at least one restaurant card is visible', async ({ page }) => {
  expect(await page.getByTestId('place-card').count()).toBeGreaterThanOrEqual(1);
});

When('they tap add-to-rotation on the first result', async ({ page }) => {
  await page.getByTestId('place-card-action').first().click();
});

Then('they land on the sign-in screen', async ({ page }) => {
  await expect(page).toHaveURL(/\/signin$/);
});

Given('the test user signs in', async ({ page }) => {
  if (!USERNAME || !PASSWORD) test.skip(true, 'TEST_USERNAME / TEST_PASSWORD not set');
  await page.goto('/signin');
  await page.locator('input[type="email"]').fill(USERNAME as string);
  await page.locator('input[type="password"]').fill(PASSWORD as string);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForFunction(
    () =>
      Object.keys(window.localStorage).some(
        (k) => k.includes('CognitoIdentityServiceProvider') && k.endsWith('.accessToken'),
      ),
    undefined,
    { timeout: 15_000 },
  );
});

When('the test user opens their rotation', async ({ page }) => {
  await page.goto('/rotation');
});

Then('a restaurant named {string} is listed', async ({ page }, name: string) => {
  await expect(page.getByTestId('place-card').filter({ hasText: name })).toBeVisible({
    timeout: 20_000,
  });
});
