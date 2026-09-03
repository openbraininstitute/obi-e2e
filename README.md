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
cp .env.example .env   # fill in the QA user, lab and project
bun run test
```

Useful commands:

```bash
bun run test              # full suite
bun run auth              # sign in only, writes .e2e-runs/live/auth/
bun run test:smoke        # only @smoke
bun run test:ui           # interactive UI mode
bun run report            # open the last HTML report
bun run check            # format check + lint + typecheck
```

## Layout

| Path          | What lives there                                                                     |
| ------------- | ------------------------------------------------------------------------------------ |
| `scenarios/`  | one folder per scenario: the English scenario, its locators, its test, its artifacts |
| `locators/`   | locators shared by more than one scenario                                            |
| `fixtures/`   | environment config, sign-in, and the extended `test` object                          |
| `setup/`      | one sign-in per user, saved for every later test                                     |
| `api/`        | HTTP helpers for arranging test data                                                 |
| `prompts/`    | what the AI does for `/e2e-generate` and `/e2e-heal`                                 |
| `scripts/ci/` | result summary and Teams card                                                        |

Tests select their context by tag rather than by folder, so one scenario can run
signed out and signed in. See `scenarios/README.md`.

## Writing a test

1. Write the scenario in `specs/`. See `specs/README.md` for the format.
2. In Claude Code, run `/e2e-generate specs/<file>.md "<Scenario name>"`.
3. The AI opens the real application, writes the test, runs it, and fixes it
   until it passes.
4. Read the test name and its `Then` checks. Confirm they match your scenario.
5. Open a pull request. A developer reviews it.

## Repairing a red test

1. Open the failing test from the Teams card.
2. Ask one question: **did the product behaviour change on purpose?**
   - Yes → update the scenario text, then run `/e2e-heal tests/<file>.spec.ts`.
   - No → the product is broken. Open a bug. Do not touch the test.
3. Review the fix and merge.

**The AI may never change an expected result to make a run pass.**
`Expected: Running, Actual: Failed` is a bug, never a test update.

## Environments

An environment is one URL plus the test users.

| Variable                                              | Meaning                                    |
| ----------------------------------------------------- | ------------------------------------------ |
| `E2E_BASE_URL`                                        | the application under test                 |
| `E2E_TEST_USERNAME` / `E2E_TEST_PASSWORD`             | the primary user                           |
| `LAB_ID` / `PROJECT_ID`                               | the primary user's virtual lab and project |
| `E2E_ONBOARDING_USERNAME` / `E2E_ONBOARDING_PASSWORD` | the onboarding user, optional              |

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

On production only `@smoke` tests run, and they must not create or delete
anything outside the QA lab and project.

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
