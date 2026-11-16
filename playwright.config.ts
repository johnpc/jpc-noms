import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * Load .env.local (gitignored) for local runs so TEST_USERNAME / TEST_PASSWORD
 * are available without a dependency. In CI these come from GitHub secrets.
 */
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

/**
 * FAKE_BACKEND=1 runs the SAME Gherkin suite against the in-browser fake
 * backend (src/fake-backend): no AWS, no secrets, no network. The dev server
 * is started with the fake aliased in, on its own port so a real-backend dev
 * server already running on :5173 is never mistaken for it, and the demo
 * account's credentials stand in for TEST_USERNAME / TEST_PASSWORD.
 */
const FAKE = process.env.FAKE_BACKEND === '1';
const PORT = FAKE ? 5174 : 5173;
if (FAKE) {
  process.env.TEST_USERNAME ??= 'demo@noms.test';
  process.env.TEST_PASSWORD ??= 'noms-demo';
}

/**
 * Acceptance tests are written as Gherkin .feature files in e2e/features/
 * with step definitions in e2e/steps/. playwright-bdd compiles them into
 * Playwright specs under .features-gen/ at run time.
 */
const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  // Scenarios tagged @requires-deploy assert LIVE backend behavior (authz,
  // owner isolation, seeded reads) that only holds once a schema change is
  // deployed; excluded from default LIVE runs so they don't go red pre-deploy
  // (include them with RUN_PENDING_DEPLOY=1 against a real sandbox). The fake
  // backend always has the current schema, so it runs every scenario.
  tags: FAKE || process.env.RUN_PENDING_DEPLOY ? undefined : 'not @requires-deploy',
});

export default defineConfig({
  testDir,
  // Refuse to run unless amplify_outputs.json points at the sandbox (never prod).
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  // Cap concurrency: every worker hits the SAME shared deployed backend, whose
  // queries slow as ingestion grows the table. Too many parallel workers
  // overwhelm it and trip timeouts on reads/writes that pass in isolation.
  // A small pool trades a little wall-clock for stability against shared state.
  workers: 4,
  forbidOnly: !!process.env.CI,
  // NO retries, anywhere. An intermittent failure is a race in the harness or
  // the app; retrying hides it. Find the condition the step should wait on
  // instead (AGENTS.md "No flaky tests").
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // A multi-step authoring scenario (sign in → compose → publish → reopen)
  // does several slow reads/writes against the loaded backend; 60s gives the
  // whole scenario room without masking a real hang.
  timeout: 60_000,
  // The suite runs against the deployed `main` backend, whose table has grown
  // large with ingested stories — reads (esp. read-after-write: publish → open
  // the new story) can exceed Playwright's 5s default. Give assertions and
  // actions more headroom so genuine slowness doesn't read as a failure.
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // SLOWMO=<ms> launches a visible browser that pauses between actions so a
    // human can watch the Gherkin run, e.g. `SLOWMO=600 npm run test:e2e`.
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },
    // VIDEO=1 records a .webm per test under test-results/ — used to attach a
    // demo artifact to a PR (see CLAUDE.md). Off by default so CI stays lean.
    video: process.env.VIDEO ? 'on' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // FAKE_BACKEND is inherited from this process's env by the dev server.
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
