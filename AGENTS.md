# Agent operating manual — Noms

Rules for anyone (human or agent) changing this repo, on top of the charter in
[CLAUDE.md](CLAUDE.md). The quality gate (`npm run quality`, husky, CI) enforces
what it can; the rest is here.

## No flaky tests

**There is no such thing as a flaky test.** A test that passes on re-run and
fails sometimes has found a race — in the harness or in the app — and the race
is the bug.

- Never re-run to green, never add a sleep, never raise a timeout to "give it
  time", never mark `.skip`/`.fixme`, never set `retries > 0`. All of these are
  refused by `scripts/check-e2e-waits.mjs` (part of `npm run quality`).
- Wait on the **real condition**: a locator becoming visible, an attribute the
  state owner publishes (`html[data-auth="authenticated"]`,
  `html[data-backend="fake"]`), a URL, a text. If the condition has no
  observable signal, add one to the owner (that is what `data-auth` is).
- When a scenario is intermittent: reproduce with `SLOWMO`/`VIDEO=1`, read the
  trace, name the race, fix the owner or the step. Write the cause in the
  commit body.
- The acceptance suite runs on two backends (below). A scenario that only
  passes on one is a bug in the app, the fake, or the scenario — not a reason
  to tag it out.

## Two backends, one suite

`e2e/features/**` is the spec. It runs:

1. **Fake backend** (`FAKE_BACKEND=1`, `npm run test:e2e:fake`) — the SDK is
   aliased to `src/fake-backend/` (in-browser, localStorage, zero network).
   Runs on every PR, forks included, on GitHub-hosted runners with no secrets.
   Demo account `demo@noms.test` / `noms-demo`; sign-up / reset codes are
   `123456`; the search term `nowhere` is the one that returns nothing.
2. **Ephemeral Amplify sandbox** (`npm run test:e2e`) — CI deploys a
   `ci-<run id>` sandbox, seeds it, runs, tears it down. The honest check of
   the real stack. Needs the owner's AWS secrets, so owner PRs + `main` only.

Both seed the SAME baseline (`amplify/seed/seed.ts` ↔ `src/fake-backend/seed.ts`).
If you add a model or a seeded row, add it to both, and extend the fake's model
API only with what the app actually calls (`src/fake-backend/data.ts`).

## One mode, one owner (state machines)

Every mode/phase/status is a discriminated union written in ONE file and
catalogued in [docs/state-machines.md](docs/state-machines.md). Components
switch on `screen.kind`; they never re-derive `loading`/`empty`/`error` from
scattered flags. `scripts/check-state-machines.mjs` keeps the catalog honest
(markers ↔ rows) and refuses new parallel `busy`/`error` booleans,
`useRef(false)` consume-flags and `setTimeout` sleeps in `src/`.

Adding a flow: write the pure union + transition function first (tested), then
the hook that owns it, then the thin component. Use `useSubmission` for any
press-and-await action and `screenGate` for the signed-out/loading prefix.

## Verification on the Mac mini

CI runs on the self-hosted Mac mini; verify there before pushing when a change
touches UI or the harness: sync the tree with rsync (never the `_work`
runner checkouts), run `npm run quality`, then `VIDEO=1 npm run test:e2e:fake`
and LOOK at the screenshots/videos under `test-results/`. Node on the mini is
at `~/actions-toolcache/node/22.23.4/arm64/bin` (not on the ssh PATH).

## Commit / PR hygiene

Conventional commits; PR title `type(scope): what shipped`; demo artifact
(screenshot or `.webm`) for anything a user can see; CI must be green and no
gate may be loosened to get there.
