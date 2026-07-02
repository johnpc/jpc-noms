# Noms

**Noms is a two-person app for deciding where to eat out.** Search restaurants (Google Places), save
favorites to a shared **rotation**, and build a **nom** — a collaborative shortlist that belongs to
_both_ partners. Either person can add options or mark one **selected**; the other is notified by push
the moment it happens. Selecting a nom sends the restaurant's address to the paired **Tesla's
navigation** via the Tessie API.

Product shape descends from `~/repo/jpc-eats` (search + rotation + the Tesla hand-off). Architecture,
quality bar, and toolchain descend from `~/repo/stoop` → `~/repo/spork` — when a pattern is unclear
here, those are the reference implementations.

## How we work together (read this first)

The person directing you (John) may be **non-technical** for a given ask — he owns the **product**. He
defines **WHAT**: features, intent, and Gherkin acceptance scenarios. **You own the HOW**:
architecture, code quality, testing, and every technical decision below.

- **Never ask him to make a technical call.** Don't surface coverage numbers, CRAP, lint, file-length,
  library choices, bundle ids, or schema design as questions — decide them yourself, silently, to the
  standards in this file. (Example decided this way: the iOS bundle id is `com.johncorser.noms` — the
  `jpc-` repo prefix is dropped and dashes are illegal in a bundle id, matching every sibling jpc app.)
- **Translate vague ideas into Gherkin.** When he describes a feature, propose concrete `.feature`
  scenarios and confirm those — that's the spec you build to.
- **Only escalate genuine _product_ questions** — ambiguous behavior, scope, copy, what a screen does.

## Workflow: specs-first vertical slices

Every feature ships as one **thin vertical slice** — UI + hook + API + backend model + tests, just
enough for the scenario, nothing speculative.

1. **Spec first.** Write/confirm Gherkin scenarios in `e2e/features/<slice>/*.feature`, steps in
   `e2e/steps/`.
2. **Scaffold backend only as the slice needs it** — add Amplify models + seed in `amplify/` for
   exactly this slice's read/write patterns; don't model ahead of a UI that uses it.
3. **Implement to pass the spec** — follow the architecture and file conventions below.
4. **Run the full quality gate** (`npm run quality`) and get it green locally.
5. **Deploy + seed** the backend if it changed (`AWS_PROFILE=personal npx ampx sandbox`, `npm run seed`).
6. **Conventional commit, push, CI green.** Open a PR; CI blocks the merge.

### PR titles (what shipped, not the backstory)

The title is a conventional-commit line — `type(scope): what changed` — naming the feature/behavior
from the reader's POV. No phase numbers, no "proven not guessed", no issue-number soup. Reference
issues in the body (`Closes #N`).

Good: `feat(noms): notify partner when they add a restaurant to a nom` ·
`fix(search): keep guest results visible when geolocation is denied`

### PR demo artifacts (screenshot or video of the new feature)

Any PR that changes something a user can see or interact with MUST include a screenshot or short video
in the description. Generate it from the slice's own Gherkin test (`VIDEO=1 npm run test:e2e` records a
`.webm`), upload to `files.jpc.io`, and paste the **permanent** `/d/` URL (a `curl -I` 307 is expected;
the `/d/` link never expires). Skip only for pure backend/config/docs changes.

## Stack

Ionic 8 + React 19 + TypeScript (strict) + Vite + Capacitor (**iOS only — no Android**). Backend is
AWS Amplify Gen2 = Cognito + AppSync + DynamoDB. Restaurant data via the Google Places API (cached in
DynamoDB). The Tesla hand-off is a DynamoDB-stream Lambda calling the Tessie API.

## The collaborative model (the core of this app)

- **Pairing** — a fixed household of two. You pair once (by partner email); after that every nom is
  automatically shared between the two members. No per-nom invites.
- **Nom** — the shared shortlist. Uses Amplify **multi-owner auth** (`members: string[]` +
  `allow.ownersDefinedIn('members')`) so _either_ partner can read AND write the same row. Fields
  include `optionPlaceIds: string[]`, `selectedPlaceId?`, `selectedBy?`, `status`.
- **Real-time** — a subscription provider wires `Nom.onCreate/onUpdate` into the react-query cache
  (`queryClient.invalidateQueries` / `setQueryData`), so a partner's edit appears live. (Ported from
  jpc-eats `SubscriptionProvider`.)
- **Push** — a Lambda on the `Nom` stream publishes an APNs notification (SNS platform app) to the
  _other_ member's registered `Device` tokens when an option is added or a nom is selected.
- **Tesla** — a Lambda on the `Nom` stream fires when `selectedPlaceId` changes to a real value; it
  reads the place's `formattedAddress` from the `GoogleApiCache` and calls
  `POST api.tessie.com/{VIN}/command/share?value={address}`. Gated by an `ALLOWED_OWNERS` allowlist.

## Amplify auth contract (client mode ↔ schema rule MUST match — stoop ADR 0004)

A request is authorized only when the client `authMode` and the model's `allow.*` rule name the **same
provider**; a mismatch returns empty/Unauthorized, not a loud error.

- The shared client (`src/lib/dataClient.ts`) defaults to **`identityPool`**; `readAuthMode()` upgrades
  signed-in users to **`userPool`** so Cognito group claims ride the JWT.
- **Read models** (e.g. place cache) grant `allow.guest()` + both authenticated providers so guest
  browsing works — never drop the guest grant or guest reads silently return empty.
- **Per-user / shared models** use `allow.owner()` / `allow.ownersDefinedIn('members')` (userPool).
- **Seed + Lambdas** write via userPool/IAM, bypassing AppSync (see `amplify/seed/seedClient.ts`).

## Code organization (vertical slices)

`src/features/<slice>/` with: `useX.ts` (hooks hold ALL logic; Context+Hook+Provider), `xApi.ts` (all
server state via react-query wrapping the Amplify client — no fetches in components), `X.tsx` (render
only), pure `x.ts` helpers (unit-tested), `X.css` (consume `--sp-*` design tokens, never hardcoded
hex/px). Tests colocated. Shared primitives live in `src/lib` and `src/features/auth`.

## Quality gates (non-negotiable — CI + husky pre-commit enforce them)

- **No `any`** (eslint error). **≤100 lines** per `.ts/.tsx` logic file (`check:lines`; extract a
  helper, never raise the limit). **≥80% coverage** (vitest + istanbul). **CRAP ≤15** (`crap`; fix with
  tests or lower complexity, never an exclusion). **Prettier clean.** **Build passes** (incl.
  `typecheck:amplify`). Every `.feature` maps to a CI matrix area (`check:features`).
- When a gate fails, **fix the code, never the gate.**

## Honest e2e

Every data-reading flow asserts on rendered **real seeded data**, not just a URL or element visibility.
Wait for the Cognito session before reading data on signed-in flows. Collaboration scenarios exercise
**two members on one nom** and assert each sees the other's change.

## Definition of done

1. `npm run quality` green locally (husky enforces it on commit).
2. Gherkin acceptance scenarios + colocated unit tests added and passing.
3. Backend deployed + seeded if any Amplify model changed.
4. Conventional commit, branch pushed, PR open, **CI green**.
5. PR description includes a demo artifact for any user-visible change.

## Commands

```
npm run dev            # Vite dev server on :5173
npm run build          # tsc + typecheck:amplify + vite build
npm run test           # unit tests (vitest)
npm run test:coverage  # unit tests + coverage (80% floor)
npm run test:e2e       # bddgen + playwright (Gherkin acceptance)
npm run quality        # the full gate (lint, format, lines, features, coverage, crap, build)
npm run e2e-config     # pull amplify_outputs.json from the sandbox
npm run prod-config    # pull amplify_outputs.json from the prod (main) backend
npm run seed           # reset the backend to a known state (needs .env.local editor creds)
npm run gen:icons      # regenerate app icons from assets/icon*.png
AWS_PROFILE=personal npx ampx sandbox   # deploy/refresh the personal backend
```

## Key facts

- **AWS:** profile `personal` (account 566092841021), region `us-west-2`. Never inline keys.
- **Sandbox stack:** `amplify-jpcnoms-xss-sandbox-c38bb97e0e` (wired into `e2e-config`).
- **Bundle id:** `com.johncorser.noms`. **Apple team:** `JW5SC3NYUV` (pinned in `project.pbxproj`).
- **Editor test user:** reused stoop creds in `.env.local` (`TEST_USERNAME`/`TEST_PASSWORD`); created in
  the sandbox Cognito pool and added to the `editors` group. Re-create if the sandbox pool is recycled.
- **Secrets** (`.env`, git-ignored): `GOOGLE_PLACES_API_KEY`, `TESSIE_API_KEY`, `TESLA_VIN`.
- iOS deploy runs on `macos-26` (iOS 26 SDK required). `ITSAppUsesNonExemptEncryption=false` is set so
  App Store uploads don't prompt for export compliance.

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `refactor:`, `test:`, `build:`).
- Throwaway scripts go in `/tmp`, never the repo.

## Decisions

- **Fixed partner pairing** (not per-nom invites): the app is for a couple; pair once, all noms shared.
- **Real APNs push** (not Web Push / iMessage): first-class native notifications on partner activity.
- **iOS only** — no Android project, no android-deploy workflow.
- **`optionPlaceIds: string[]` on `Nom`** (not a child `NomOption` model): matches eats's `Choice`,
  fewer files, simpler.
- **Tesla hand-off re-implemented in-repo** as an Amplify Gen2 stream Lambda (the eats original lived
  only as a deployed Lambda, never in source).
