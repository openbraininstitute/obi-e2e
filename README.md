# obi-e2e

End-to-end tests for the OBI web application. Scenarios are written in plain
English by product owners; the tests are Playwright and are generated from those
scenarios with AI, then reviewed by a developer like any other code.

Runtime: **Bun 1.4** and **Playwright 1.62**. Linting and formatting use
[oxc](https://oxc.rs) (`oxlint` and `oxfmt`).

Tests run under Bun, not Node. Every script uses `bun --bun playwright`, which
Bun 1.4 supports and which makes Bun APIs such as `Bun.write` available inside
test code. Plain `bunx playwright` would run the workers under Node instead, so
prefer `bun run test` over calling Playwright directly.

## Quick start

```bash
bun install
bunx playwright install --with-deps chromium
cp .env.local.example .env.staging.local   # fill in the QA user, lab, webhook
bun run test
```

### Environment files

A deployment is not only a URL: staging and production keep separate realms, so
an account good on one cannot sign in to the other. What differs by deployment
lives in the deployment's own file, and what is secret lives beside it in a file
that is never committed.

| Read | File                      | Committed | Holds                                           |
| ---- | ------------------------- | --------- | ----------------------------------------------- |
| 1    | the environment           | —         | anything exported, or given on the command line |
| 2    | `.env.<deployment>.local` | no        | the users, `LAB_ID`, the Teams webhook          |
| 3    | `.env.<deployment>`       | yes       | the base URL, the backend hosts                 |
| 4    | `.env`                    | yes       | workers, log level, the report layout           |

First value wins, and an empty value counts as no value. The deployment is read
from the base URL's host, or named outright with `E2E_ENV`, which is also what a
preview build of the production release needs:

```bash
bun run test                       # staging:    .env.staging.local, .env.staging, .env
E2E_ENV=production bun run test    # production: .env.production.local, .env.production, .env
```

A locally served app is not a third deployment. It is staging — same users, same
lab, same backend — with the application somewhere else, so it needs no file of
its own and picks up `.env.staging.local` like any staging run:

```bash
bun run test:local                 # app on localhost:3001, staging behind it
bun run test:local:production      # the same app against production
```

Anything else the suite reads from the deployment it belongs to. `local` as a
deployment would not work: every workflow fixture names the deployments it runs
on, and the `@staging` and `@production` tags filter on the same value, so a
third name would skip every workflow.

Only the two `.local` files are secret, so they are the only ones GitHub needs
as secrets. Everything else CI reads from the checkout, which is why the
workflow sets `E2E_ENV` and the accounts and nothing more.

A deployment-specific value left in `.env` reaches both runs, which is the one
mistake this layout exists to prevent.

Useful commands:

```bash
bun run test              # full suite, staging
bun run test:local        # the app on localhost:3001, staging users and backend
bun run auth              # sign in only, writes .e2e-runs/live/auth/
bun run test:ui           # interactive UI mode
bun run report            # open the last HTML report
bun run preflight         # what a run would resolve to, and the machine's size
bun run reclaim           # give back what a killed run kept
bun run check            # format check + lint + typecheck
```

## Layout

| Path          | What lives there                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `scenarios/`  | grouped by product section, then one folder per scenario with its text, seed, locators and test |
| `locators/`   | locators shared by more than one scenario                                                       |
| `fixtures/`   | the vocabulary a spec writes with, plus `run/`, `steps/`, `checks/` and `scan-config/`          |
| `setup/`      | one sign-in per user, saved for every later test                                                |
| `api/`        | HTTP helpers for arranging test data                                                            |
| `prompts/`    | what the AI does for `/e2e-generate` and `/e2e-heal`                                            |
| `scripts/ci/` | result summary and Teams card                                                                   |

Tests select their context by tag rather than by folder, so one scenario can run
signed out and signed in. See `scenarios/README.md`, and `docs/scenario-tags.md`
for what each tag means and how to choose one.

## Reporting

Every run produces the same two tables, in the GitHub job summary, the pull
request comment and the Teams card:

- **Endpoints** — each backend service with its version and health, and the
  reason when one is down or skipped.
- **Features** — one row per product section, which expands to the scenarios
  under it, each with its status, pass rate and duration.

`bun run summarize` rebuilds them from `test-results/results.json`.
`bun run notify` does that and posts the Teams card.

### Posting one message or several

| `TEAMS_LAYOUT` | What happens                                             |
| -------------- | -------------------------------------------------------- |
| unset          | one message with everything (default)                    |
| `split`        | one message for the summary, then one per section        |
| `thread`       | one request carrying every card, for a flow that replies |

`split` and `thread` both build the same cards: the summary and services first,
then one per section, split across numbered messages when a section's table
would exceed the payload limit.

The difference is who posts them. With `split` this repo sends one request per
card, and they land as separate channel messages. The webhook answers
`202 Accepted` with an empty body and no message id, so nothing here can reply
to a message it just created.

`thread` sends every card in one request as `{ "cards": [ ... ] }`. The flow
behind the webhook then does the threading, because it is the only thing that
sees the message id.

### Payload limits

Teams refuses a message over 28 KB, card JSON included. This repo builds to a
25 KB ceiling, leaving room to spare. Three things keep every message under it:

- Every variable string is clamped before it reaches a cell. Test titles,
  service errors and scenario names have no natural bound, and one long one used
  to push a card past 90 KB.
- A section that still would not fit is split across numbered messages, measured
  by real byte count as each feature is added.
- The summary message drops detail a level at a time if the service table and
  failures grow too large.

The limit applies per message, not per request, so `thread` mode sends all cards
in one larger request and the flow posts each separately. That combined request
is not held to 28 KB by anything: measured against a run the size of this suite
it came to roughly 32 KB, which the Power Automate endpoint accepts and a legacy
connector webhook would not. See [docs/teams-reporting.md](docs/teams-reporting.md#limits-worth-knowing).

### Making the flow reply

`thread` needs a Power Automate workflow behind the webhook: it posts the first
card, keeps its message id, and replies with the rest. Setting one up on a new
channel, testing it, and what to do when it misbehaves are all in
[docs/teams-reporting.md](docs/teams-reporting.md).

## Before the tests run

Every run first checks that the backend services are healthy and reports their
versions. A service that is down fails there, with its name, instead of showing
up as a wall of broken tests. The launch system is skipped because it answers
only inside the VPC. See `api/README.md`.

Then the run takes a project of its own. The lab is long-lived and shared —
a run per open pull request, plus whoever is testing locally — and a lab holds
at most forty projects, so a run creates one, works inside it, and deletes it at
the end rather than everyone writing into the same place.

A new project is empty and cannot pay for a simulation, so the run moves a budget
into it. `E2E_PROJECT_CREDITS` says how much, and defaults to 2000; the card at
the end reports what the run actually spent, which is the number to correct it
with.

Taking a project costs nothing, so a run takes one whatever the lab holds and
everything that only reads runs either way. Only the tests tagged `@spends` need
the money, and one check stands in front of them — so an empty lab stops those,
once, instead of every launching test failing later for a reason that reads like
a product bug.

| What happens                         | What follows                                                       |
| ------------------------------------ | ------------------------------------------------------------------ |
| the lab holds less than a run needs  | `@spends` tests do not run; everything else does                   |
| the transfer in fails                | the project is emptied and handed back; `@spends` tests do not run |
| the lab already holds forty projects | the run stops, naming leftover projects as the cause               |
| the transfer back at the end fails   | reported, and the run stays green                                  |
| the project cannot be deleted        | the run fails: it has taken one of the lab's forty for good        |

None of these are product bugs, so the card says so in its own words rather than
leaving a list of failing tests to imply one. What the run did with the money —
spent, returned to the lab, or stranded because the transfer back failed — is
reported as its own block and charted on the summary card. Set `TEAMS_ALERT_MENTIONS` to
`Name <sign-in address>`, comma separated, and the people named are tagged when
the lab cannot pay. Mentions render only when the webhook is a Power Automate
flow posting the card.

There is no way to point a run at a project that already exists. A run that
wrote into one would leave its data behind, which is the thing the per-run
project exists to prevent.

## What a run logs

Setup and teardown write structured records with pino: which lab and project a
run took, the commit under test, when it started, and what it could afford
before it spent anything.

`E2E_LOG_FORMAT` picks the shape. `text` is indented and colourised for a
terminal; `json` is one record per line, which is what CI archives and what a
log collector expects. It defaults to `json` in CI and `text` everywhere else.
`E2E_LOG_LEVEL` sets the threshold, `info` by default.

```
{"level":"info","time":"2026-09-04T11:01:36.029Z","worker":48184,
 "run":"1788519696016-48184","startedAt":"2026-09-04T11:01:36.016Z",
 "commit":"901cb78…","lab":"5b1d0f7a…","project":"86aab5cb…",
 "credits":{"labBalanceBefore":6800,"required":2000,"assigned":2000},
 "msg":"run prepared"}
```

## Imports and shared values

Modules are imported by alias, not by counting `../` segments:

| Alias         | Points at           |
| ------------- | ------------------- |
| `@/*`         | the repository root |
| `@fixtures/*` | `fixtures/`         |
| `@locators/*` | `locators/`         |
| `@api/*`      | `api/`              |

`fixtures/entity-types.ts` mirrors the application's `ExtendedEntitiesTypeDict`
and is the single source of truth for entity types. Listing slugs are derived
from it with `kebabCase` from `es-toolkit`, the same way the application builds
them, so a slug is never written down twice.

`fixtures/tags.ts` holds the tag combinations. Import one rather than retyping
the strings: a typo in a tag means the test never runs and nothing warns you.

## The commands

### Everyday scripts

| Command               | What it does                                    | When you use it                              |
| --------------------- | ----------------------------------------------- | -------------------------------------------- |
| `bun run test`        | Runs the whole suite against staging.           | The normal run.                              |
| `bun run test:local`  | Same, against `http://localhost:3001`.          | You are running the app on your own machine. |
| `bun run test:headed` | Same, with a visible browser.                   | You want to watch it click.                  |
| `bun run test:debug`  | Same, stopping so you can step through.         | A test fails and you cannot see why.         |
| `bun run check`       | Formatting, linting, types, and the unit tests. | Always, before you commit.                   |
| `bun run report`      | Opens the HTML report of the last run.          | To read a failure in detail.                 |

### Checking and generating scenarios

`casebook` is the tool that keeps a scenario and its test in step.

| Command                                                         | What it does                                                                                                                                                                                                                                   | When you use it                                                    |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `bun run casebook`                                              | Checks every `scenario.md` under `scenarios/`. Says what is wrong, and on which line.                                                                                                                                                          | Before you commit. In CI.                                          |
| `bun run casebook scenarios/workflows`                          | The same check, on that folder only. A section, one scenario, or one `.md` file all work.                                                                                                                                                      | While writing one scenario. Faster, less noise.                    |
| `bun run casebook skeleton scenarios/workflows/build-synaptome` | Writes `build-synaptome.spec.ts` from the scenario: one `test.describe`, one `test.fixme` per case, the English kept inside as comments. Run it again later and it adds only the cases that have no test, and names any test that has no case. | Right after you write or change a scenario.                        |
| `bun run casebook run scenarios/workflows/build-synaptome`      | Runs that folder's tests through Playwright. A `.spec.ts` path runs one file. Any flag it does not know (`--headed`, `--grep`, `--list`) is passed to Playwright.                                                                              | To see whether the tests pass.                                     |
| `bun run casebook --json`                                       | The same check, as JSON.                                                                                                                                                                                                                       | For a tool, not a person.                                          |
| `bun run casebook --github`                                     | The same check, one line per problem, in GitHub's format.                                                                                                                                                                                      | In CI, so each problem shows on the pull request next to its line. |
| `bun run casebook --no-seeds`                                   | Skips the check that every `Seed:` file really exists.                                                                                                                                                                                         | Rare. Only while a seed is still missing on purpose.               |
| `bun run casebook --help`                                       | Prints all of the above.                                                                                                                                                                                                                       | When you forget.                                                   |

### The two AI commands

These are not shell commands. You type them in Claude Code.

| Command                                             | What it does                                                                                                                                                                                                                     | When you use it                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `/e2e-generate scenarios/workflows/build-synaptome` | Checks the scenario, writes the skeleton, then fills every `test.fixme` with real Playwright code, reusing the fixtures and locators already in the repo. Add a case title in quotes to do one case only.                        | You have a scenario and no tests yet.                            |
| `/e2e-heal scenarios/workflows/build-synaptome`     | Runs the skeleton to see what moved. A new case gets written. A renamed case gets its test renamed. A changed line gets its assertion changed. Then it runs the tests and repairs how they find things — never what they expect. | The scenario changed, or the app changed, and the tests are red. |

### Who runs what

A researcher writing a scenario needs one command:

```bash
bun run casebook scenarios/workflows/build-synaptome
```

Green means the scenario is well formed. Red names the line and the fix.

An engineer with a new scenario:

```bash
/e2e-generate scenarios/workflows/build-synaptome
bun run casebook run scenarios/workflows/build-synaptome
bun run check
```

An engineer with a red test:

```bash
/e2e-heal scenarios/workflows/build-synaptome
```

### One rule holds it together

A test is tied to its case by **title**, and by nothing else. `## The form will
not launch` in the scenario is `test('The form will not launch', …)` in the
spec. Keep the two exactly equal, and `skeleton` can always tell you what is new
and what is gone. Rename one side only, and the link is lost.

## Writing a test

1. Write the scenario in `scenarios/`. See `scenarios/README.md` for the format,
   and `tools/casebook/README.md` for every line it may contain.
2. In Claude Code, run `/e2e-generate scenarios/<section>/<name>`.
3. The AI opens the real application, writes the test, runs it, and fixes it
   until it passes.
4. Read the test name and its `Then` checks. Confirm they match your scenario.
5. Open a pull request. A developer reviews it.

## Repairing a red test

1. Open the failing test from the Teams card.
2. Ask one question: **did the product behaviour change on purpose?**
   - Yes → update the scenario text, then run `/e2e-heal scenarios/<section>/<name>`.
   - No → the product is broken. Open a bug. Do not touch the test.
3. Review the fix and merge.

**The AI may never change an expected result to make a run pass.**
`Expected: Running, Actual: Failed` is a bug, never a test update.

## Environments

An environment is one URL plus the test users.

| Variable                                              | Meaning                                               |
| ----------------------------------------------------- | ----------------------------------------------------- |
| `E2E_BASE_URL`                                        | the application under test                            |
| `E2E_TEST_USERNAME` / `E2E_TEST_PASSWORD`             | the primary user                                      |
| `LAB_ID`                                              | the primary user's virtual lab                        |
| `E2E_PROJECT_CREDITS`                                 | what to move into that project, default 2000          |
| `E2E_ONBOARDING_USERNAME` / `E2E_ONBOARDING_PASSWORD` | the onboarding user, optional                         |
| `E2E_ENV`                                             | `staging` or `production`, when the host does not say |
| `E2E_LOG_FORMAT` / `E2E_LOG_LEVEL`                    | how the run logs; see below                           |

The project is not configured. Every run creates one, spends inside it, and
deletes it at the end.

There are two test users because a user may own only one virtual lab, and the
suite is split by what each is responsible for.

The **primary** user owns one established lab and covers the work inside it:
workflows, data and notebooks. It never creates or deletes a lab.

The **onboarding** user starts owning nothing and covers everything before that
point: creating a lab, creating projects and inviting members. It deletes what
it creates, and cleans up at the start of a run as well as the end, so one
cancelled run does not block the next. Leave its credentials blank and those
tests skip rather than fail.

Pages any visitor can reach are checked signed out, by neither user.

Sign-in happens once per user per run. The Keycloak theme hides the username and
password fields and offers only social providers, so the login form is submitted
directly. Each sign-in saves browser storage state and an access token that API
helpers use to arrange and clean up test data.

Every test runs against both staging and production. A test says nothing about
deployments and runs on both, which is what almost all of them want.

The exceptions carry a tag. `@staging` keeps a test off production — a feature
that has not shipped there yet — and `@production` keeps one off staging. The
config excludes the other deployment's tag, so a local run against production
skips the same tests CI does.

Workflows do not use those tags. A scan-config fixture's `env` list is the only
thing that decides where its workflow runs, because which deployments offer a
workflow is a fact about the release rather than about the test.

## When tests run

See `.github/workflows/README.md`.

## The Playwright MCP server

CI never uses it. It runs only on a laptop, while the AI is writing or repairing
a test, and it stops when the command ends. The tests in `tests/` are ordinary
Playwright files that run with `playwright test` and need no AI and no API key.

## Rules that keep this healthy

- A flaky test is a bug. Fix it or delete it. Never add retries to hide it.
- Prefer role and label locators. Never CSS classes.
- No `waitForTimeout`. Web-first assertions already wait.
- One test is independent of every other test.
- Tests check what the user sees, not internal services. Swap a backend and keep
  the screen the same, and the test stays green.
- Every bug fix gets one scenario that would have caught it.
