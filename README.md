# obi-e2e

End-to-end tests for the OBI web app.

Scientists and product owners write what should happen, in plain English, in a
`scenario.md` file. AI turns each file into a Playwright test. A developer
reviews that test like any other code.

Runs on Bun 1.4 and Playwright 1.62. Common repository commands are available
through the `Makefile`; the equivalent `bun run …` commands also remain
supported. Never use `bunx playwright`: the tests need Bun, not Node.

## Setup

```bash
bun install
bun run browsers
cp .env.local.example .env.staging.local   # fill in the users, LAB_ID, webhook
bun run test
```

`make install` also writes the `playwright-cli` skill (`.claude/skills/` for
Claude Code, `.agents/skills/` for everything else): the AI opens the app
with the [Playwright CLI](https://playwright.dev/agent-cli/introduction), not the
Playwright MCP server. The project's own Playwright provides it, so nothing is
needed globally — `npm install -g @playwright/cli@latest` only buys you the
shorter `playwright-cli …` command in your own shell.

Secrets live in `.env.staging.local` and `.env.production.local`, which are
never committed. URLs live in `.env.staging` and `.env.production`, which are.
`.env` holds what both share. A value set in your shell wins over every file.

```bash
bun run test                        # staging
E2E_ENV=production bun run test     # production, with its own users and lab
bun run test:local                  # the app on localhost:3001, staging behind it
```

## Write a scenario

Create a starter scenario from a title:

```bash
bun run scenario "synaptome build"
# created scenarios/synaptome-build/scenario.md
```

The command writes the title, `User: authenticated`, all possible user values
as comments, and the first `## Fill your first test use case` heading. It does
not overwrite an existing scenario. Common repository commands are also
available in the `Makefile`, for example:

```bash
make scenario "synaptome build"
make test scenarios/synaptome-build
make check
```

Arguments can be passed directly after the command. For Playwright flags, put
`--` before the flags so `make` does not parse them itself:

```bash
make test scenarios/workflows
make test -- --grep @credits
```

The older `TITLE="..."` and `ARGS="..."` forms are still supported.

One folder per scenario, under the product section it belongs to:

```text
scenarios/data/cell-morphology/browse/
  scenario.md       what should happen, in English
  browse.spec.ts    the test, generated from it
  locators.ts       optional: how the test finds things on this page
  seed.json         optional: the form values a workflow test fills in
```

A scenario is a title, one `User:` line, and one `## ` case per test:

```markdown
# Morphology listing

User: authenticated

## The close button keeps my search

Steps:

1. Search for "Sst-IRES"
2. Note the result count
3. Open the first result
4. Click "Close"

Expected:

- The search box still contains "Sst-IRES"
- The result count is the same as noted
```

Three habits:

- Quotes mean exact words on the screen.
- One `Expected` line checks one thing.
- Say what you compare to. "The same as noted" works. "The same as before" does not.

`User:` says who is signed in:

| `User:`         | Who                                                     |
| --------------- | ------------------------------------------------------- |
| `visitor`       | nobody, signed out                                      |
| `authenticated` | the QA user, inside the project the run made for itself |
| `credits`       | same, and the test launches a build or a run            |
| `onboarding`    | a user who owns nothing yet: signing up, and after      |

Every test runs on both staging and production. A scenario that cannot says
`Only on: staging` or `Only on: production`.

The full format, every optional line, and what the checker refuses:
[tools/casebook/README.md](tools/casebook/README.md). The tags behind `User:`:
[docs/scenario-tags.md](docs/scenario-tags.md). Workflow scenarios and their
seeds: [docs/workflow-tests.md](docs/workflow-tests.md).

Check a scenario before you commit it:

```bash
bun run casebook scenarios/data/cell-morphology/browse
```

Green means well formed. Red names the line and the fix.

## Make the test

In Claude Code, Cursor, or Kiro:

```text
/e2e-generate scenarios/data/cell-morphology/browse
```

The command is one file per agent — `.claude/commands/`, `.cursor/commands/`,
`.kiro/steering/` — and all three run the same procedure from `prompts/`.
`AGENTS.md` is `CLAUDE.md`, so the rules are the same wherever you work.

The AI checks the scenario, opens the real app in a headless `playwright-cli`
browser, writes one test per case, runs it, and fixes it until it passes. Then:

1. Read each test title and its checks. They must match your scenario.
2. Run `bun run test scenarios/data/cell-morphology/browse`, then `bun run check`.
3. Open a pull request. A developer reviews it.

A test and its case are linked by **title only**. `## The close button keeps my
search` in the scenario is `test('The close button keeps my search', …)` in the
spec. Rename one side and the link is lost.

## Fix a red test

Ask one question: **did the product change on purpose?**

- Yes: update the scenario text, then run `/e2e-heal scenarios/<section>/<name>`.
  It rewrites the tests whose case changed and repairs how the others find things.
- No: the product is broken. Open a bug. Do not touch the test.

Never change an expected result to make a run pass. `Expected: Running, Actual:
Failed` is a bug, not a test update.

## Run the tests

```bash
bun run test                          # everything, on staging
bun run test scenarios/data           # one section, or one scenario folder
bun run test --grep @credits          # by tag
bun run test:headed                   # watch the browser
bun run test:ui                       # Playwright UI mode
bun run report                        # open the last HTML report
bun run check                         # format, lint, types, unit tests
```

## What a run does

1. Checks that the backend services are healthy. A service that is down fails
   the run with its name, not with a wall of red tests.
2. Signs in each user once and saves the session.
3. Creates a project in the lab, named after the run, and moves credits into it
   (`E2E_PROJECT_CREDITS`, default 2000). Only tests that spend credits need
   this. When the lab cannot pay, those do not run and everything else does.
4. Runs the tests.
5. Returns the credits and deletes the project. This also happens when you stop
   the run with Ctrl+C, when the run is killed, and when CI cancels the job. If
   something is still left behind, run `bun run auth` and then `bun run reclaim`.

The summary at the end says what the run spent and whether the project was
returned. When CI runs: [.github/workflows/README.md](.github/workflows/README.md).
The Teams card: [docs/teams-reporting.md](docs/teams-reporting.md).

## Rules for test code

- Import `test` and `expect` from `@fixtures/test`, never from `@playwright/test`.
- Import by alias (`@/`, `@fixtures/`, `@locators/`, `@api/`), never `../../..`.
- Find things by role, label or text. Never by CSS class.
- No `waitForTimeout`. Assertions already wait.
- Tags come from `fixtures/tags.ts`. Entity types come from `fixtures/entity-types.ts`.
- Every test stands alone and leaves nothing behind outside the QA lab.
- A flaky test is a bug. Fix it or delete it. Never add retries to hide it.
- Every bug fix gets one scenario that would have caught it.

## Layout

| Path              | What lives there                                                      |
| ----------------- | --------------------------------------------------------------------- |
| `scenarios/`      | one folder per scenario: text, seed, locators, test                   |
| `locators/`       | locators used by more than one scenario                               |
| `fixtures/`       | what a test writes with: tags, steps, checks, run setup               |
| `setup/`          | health check, sign-in, project creation and teardown                  |
| `api/`            | HTTP helpers for the backend                                          |
| `tools/casebook/` | the scenario checker and skeleton writer                              |
| `prompts/`        | what the AI follows for `/e2e-generate` and `/e2e-heal`               |
| `scripts/ci/`     | preflight, teardown, reclaim, result summary, Teams card              |
| `perf/`           | Lighthouse on the marketing pages every night, and its own Teams card |
| `docs/`           | tags, workflow tests, Teams reporting                                 |

## Environment variables

| Variable                                              | Meaning                                             |
| ----------------------------------------------------- | --------------------------------------------------- |
| `E2E_TEST_USERNAME` / `E2E_TEST_PASSWORD`             | the QA user                                         |
| `LAB_ID`                                              | that user's lab                                     |
| `E2E_ONBOARDING_USERNAME` / `E2E_ONBOARDING_PASSWORD` | the user who owns nothing. Blank skips its tests    |
| `E2E_BASE_URL`                                        | the app under test. Default: staging                |
| `E2E_ENV`                                             | `staging` or `production`                           |
| `E2E_PROJECT_CREDITS`                                 | credits moved into the run's project. Default: 2000 |
| `MS_TEAMS_WEBHOOK_URI`                                | where the result card goes                          |
| `PLAYWRIGHT_BROWSER`                                  | `chromium` (default), `firefox` or `webkit`         |
| `E2E_LOG_FORMAT` / `E2E_LOG_LEVEL`                    | `text` or `json`. `info` by default                 |

---

Copyright (c) 2026 Open Brain Institute.
