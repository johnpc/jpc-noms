#!/usr/bin/env node
/**
 * "No flaky tests" guard for the acceptance harness (AGENTS.md). A test that
 * sleeps, retries or skips is a test that hides a race instead of waiting on
 * the condition it actually needs. Fails on, anywhere under e2e/ or in
 * playwright.config.ts:
 *   - page.waitForTimeout(...) / setTimeout(...)      fixed sleeps
 *   - test.skip( / test.fixme( / .only(               silently not running
 *   - retries: <non-zero>                             re-running a failure
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const walk = (dir) =>
  readdirSync(dir).flatMap((e) => {
    const full = join(dir, e);
    return statSync(full).isDirectory() ? walk(full) : /\.ts$/.test(e) ? [full] : [];
  });
const files = [...walk(join(ROOT, 'e2e')), join(ROOT, 'playwright.config.ts')];

const BANNED = [
  [/waitForTimeout\s*\(/, 'fixed sleep (waitForTimeout) — wait on a locator/attribute/URL instead'],
  [/\bsetTimeout\s*\(/, 'fixed sleep (setTimeout) — wait on a real condition instead'],
  [/\btest\.(skip|fixme)\s*\(/, 'skipped test — fail loudly or fix the precondition'],
  [/\.only\s*\(/, '.only — never commit a narrowed run'],
];

const problems = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comments may mention the words
    for (const [re, why] of BANNED)
      if (re.test(line)) problems.push(`${relative(ROOT, f)}:${i + 1}: ${why}`);
    const retries = line.match(/\bretries:\s*([^,\n]+)/);
    if (retries && retries[1].trim() !== '0')
      problems.push(
        `${relative(ROOT, f)}:${i + 1}: retries must be 0 — an intermittent failure is a race to fix, not to re-run`,
      );
  });
}

if (problems.length) {
  console.error('\n✖ e2e wait discipline:');
  for (const p of problems) console.error(`    ${p}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ ${files.length} e2e files wait on real conditions (no sleeps, skips, retries).`);
