/// <reference types="vitest" />

import { fileURLToPath } from 'node:url';
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * FAKE_BACKEND=1 swaps the Amplify SDK for the in-browser fake under
 * src/fake-backend (no Cognito, no AppSync, no network): the three `aws-amplify`
 * entry points the app imports are aliased to the shims, and the generated
 * `amplify_outputs.json` resolves to a stub so the build needs no deployed
 * backend at all. App code is untouched — see README "Fake backend".
 */
const FAKE = process.env.FAKE_BACKEND === '1';
const shim = (file: string) =>
  fileURLToPath(new URL(`./src/fake-backend/${file}`, import.meta.url));

const fakeBackendPlugin = (): Plugin => ({
  name: 'noms-fake-backend',
  enforce: 'pre',
  resolveId(source) {
    return source.endsWith('amplify_outputs.json') ? shim('outputs.json') : null;
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), legacy(), ...(FAKE ? [fakeBackendPlugin()] : [])],
  resolve: {
    alias: FAKE
      ? [
          { find: /^aws-amplify$/, replacement: shim('amplify.ts') },
          { find: /^aws-amplify\/auth$/, replacement: shim('session.ts') },
          { find: /^aws-amplify\/data$/, replacement: shim('data.ts') },
        ]
      : [],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // Generous timeout so async hook/waitFor tests don't flake under the CPU
    // contention of the pre-commit hook (build + tests running together).
    testTimeout: 15000,
    // Acceptance tests live in e2e/ and run under Playwright, not Vitest.
    // .features-gen/ holds Playwright-BDD's generated specs — never Vitest's.
    exclude: ['node_modules', 'dist', 'e2e', '.features-gen', '.idea', '.git', '.cache', '.claude'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      // Measure EVERY source + amplify LOGIC file, even untested ones.
      all: true,
      include: ['src/**/*.{ts,tsx}', 'amplify/**/*.ts'],
      // Excluded: tests, type decls, setup — AND declarative amplify files
      // (resource/backend config, fixture data) + the seed runner entrypoint
      // (side-effects on import; its logic lives in tested helpers). Backend
      // LOGIC (seed helpers, Lambda handlers) IS measured — fix low coverage
      // with tests, never an exclusion.
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/setupTests.ts',
        'amplify/**/resource.ts',
        'amplify/backend.ts',
        'amplify/seed/fixtures/**',
        // Seed/maintenance runner entrypoints: side-effecting main() scripts
        // (sign in, mutate, exit) with no unit-testable surface — their logic
        // lives in tested helpers. Run manually.
        'amplify/seed/seed.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
