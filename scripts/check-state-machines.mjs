#!/usr/bin/env node
/**
 * State-machine catalog guard. docs/state-machines.md lists every explicit
 * machine in the app with its OWNER file (the one place its state is written).
 * This keeps the catalog honest in both directions and flags new implicit
 * machines before they spread:
 *
 *   1. every catalog row's owner file exists and carries `@state-machine <id>`;
 *   2. every `@state-machine <id>` marker in the repo has a catalog row;
 *   3. product code (src/, non-test) must not grow the classic implicit shapes
 *      — parallel `busy`/`loading`/`error` useState booleans, `useRef(false)`
 *      consume-flags, or a `setTimeout` sleep — unless the file is cited in the
 *      catalog (so the pattern is a documented decision, not an accident).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const CATALOG = join(ROOT, 'docs', 'state-machines.md');
const SCAN_ROOTS = ['src', 'amplify', 'scripts', 'e2e'];
const SKIP = new Set(['node_modules', '.amplify', 'dist', 'build', 'fixtures']);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

const rel = (f) => relative(ROOT, f).split('\\').join('/');
const isTest = (f) => /\.test\.(ts|tsx)$/.test(f);
const files = SCAN_ROOTS.filter((d) => existsSync(join(ROOT, d))).flatMap((d) =>
  walk(join(ROOT, d)),
);

// 1 + 2: catalog rows ↔ markers.
const catalog = readFileSync(CATALOG, 'utf8');
const rows = [...catalog.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|\s*`([^`]+)`\s*\|/gm)].map((m) => ({
  id: m[1],
  owner: m[2],
}));
const cited = new Set(
  [...catalog.matchAll(/`((?:src|amplify|scripts|e2e)\/[^`\s]+)`/g)].map((m) => m[1]),
);
const problems = [];

const markers = new Map(); // id -> [file]
for (const f of files) {
  for (const m of readFileSync(f, 'utf8').matchAll(/@state-machine\s+([a-z0-9-]+)/g)) {
    markers.set(m[1], [...(markers.get(m[1]) ?? []), rel(f)]);
  }
}
for (const row of rows) {
  if (!existsSync(join(ROOT, row.owner)))
    problems.push(`catalog row \`${row.id}\`: owner ${row.owner} does not exist`);
  else if (!(markers.get(row.id) ?? []).includes(row.owner))
    problems.push(
      `catalog row \`${row.id}\`: ${row.owner} lacks a \`@state-machine ${row.id}\` marker`,
    );
}
const rowIds = new Set(rows.map((r) => r.id));
for (const [id, where] of markers) {
  if (!rowIds.has(id))
    problems.push(`marker \`@state-machine ${id}\` in ${where.join(', ')} has no catalog row`);
}

// 3: implicit shapes in product code.
const IMPLICIT = [
  [
    /useState(?:<boolean>)?\(\s*false\s*\)/,
    'a bare boolean useState (busy/loading/open?) — derive it from one owner state',
  ],
  [
    /const \[\s*(?:busy|loading|working|pending|submitting|saving)\s*,/,
    'a parallel busy/loading flag — use useSubmission or a screen union',
  ],
  [
    /const \[\s*error\s*,\s*setError\s*\]/,
    'a parallel error field — fold it into the owning union',
  ],
  [/useRef(?:<boolean>)?\(\s*false\s*\)/, 'a useRef(false) consume-flag — make the phase explicit'],
  [/\bsetTimeout\s*\(/, 'a timer sleep in product code — wait on a real condition/state instead'],
];
for (const f of files.filter((x) => rel(x).startsWith('src/') && !isTest(x))) {
  const text = readFileSync(f, 'utf8');
  const r = rel(f);
  for (const [re, why] of IMPLICIT) {
    if (re.test(text) && !cited.has(r))
      problems.push(`${r}: ${why} (or cite the file in docs/state-machines.md with the reason)`);
  }
}

if (problems.length) {
  console.error(`\n✖ State-machine catalog check failed:`);
  for (const p of problems) console.error(`    ${p}`);
  console.error(
    '\n  Fix: add/correct the row in docs/state-machines.md and the `// @state-machine <id>` marker in the owner.\n',
  );
  process.exit(1);
}
console.log(
  `✓ ${rows.length} catalogued state machines ↔ ${markers.size} markers agree; no new implicit machines in src/.`,
);
