import { expect } from '@playwright/test';
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
  await expect(page.getByTestId('place-card').first()).toBeVisible({ timeout: 20_000 });
  expect(await page.getByTestId('place-card').count()).toBeGreaterThanOrEqual(1);
});

Then('a restaurant card shows a street address', async ({ page }) => {
  await expect(page.getByTestId('place-card-address').first()).toBeVisible({ timeout: 20_000 });
});

Then("a restaurant card shows today's opening hours", async ({ page }) => {
  await expect(page.getByTestId('place-card-hours').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('place-card-hours').first()).toContainText('Today:');
});

Then("its card shows today's hours of {string}", async ({ page }, hours: string) => {
  await expect(page.getByTestId('place-card-hours').first()).toHaveText(hours, {
    timeout: 20_000,
  });
});

When('they tap the {string} suggestion', async ({ page }, label: string) => {
  await page.getByTestId(`suggestion-${label}`).click();
});

When('they tap add-to-rotation on the first result', async ({ page }) => {
  await page.getByTestId('place-card-action').first().click();
});

Then('they land on the sign-in screen', async ({ page }) => {
  await expect(page).toHaveURL(/\/signin$/);
});

Given('the test user signs in', async ({ page }) => {
  // Never skip: a missing credential is a broken harness, not a passing run.
  if (!USERNAME || !PASSWORD) throw new Error('TEST_USERNAME / TEST_PASSWORD must be set');
  await page.goto('/signin');
  await page.locator('input[type="email"]').fill(USERNAME);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // The AuthProvider — the one owner of the session — mirrors its status onto
  // <html data-auth>; wait on THAT, not on an SDK storage key.
  await expect(page.locator('html')).toHaveAttribute('data-auth', 'authenticated', {
    timeout: 15_000,
  });
});

When('the test user opens their rotation', async ({ page }) => {
  await page.goto('/rotation');
});

Then('a restaurant named {string} is listed', async ({ page }, name: string) => {
  await expect(page.getByTestId('place-card').filter({ hasText: name })).toBeVisible({
    timeout: 20_000,
  });
});
