# obi-e2e

End-to-end tests for the OBI web application. Scenarios are written in plain
English by product owners; the tests are Playwright and are generated from those
scenarios with AI, then reviewed by a developer like any other code.

Runtime: **Bun 1.4** and **Playwright 1.62**. Linting and formatting use
[oxc](https://oxc.rs) (`oxlint` and `oxfmt`).

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
bun run test:smoke        # only @smoke
bun run test:ui           # interactive UI mode
bun run report            # open the last HTML report
bun run check            # format check + lint + typecheck
```

## Layout

| Path          | What lives there                                                      |
| ------------- | --------------------------------------------------------------------- |
| `specs/`      | English scenarios, one file per feature                               |
| `tests/`      | Playwright tests: `public/` needs no login, `private/` runs signed in |
| `pages/`      | Page objects — locators and actions, no assertions                    |
| `fixtures/`   | Environment config and the extended `test` object                     |
| `setup/`      | One-time sign-in that saves storage state                             |
| `api/`        | HTTP helpers for arranging test data                                  |
| `prompts/`    | What the AI does for `/e2e-generate` and `/e2e-heal`                  |
| `scripts/ci/` | Result summary and Teams card                                         |

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

There are two test users because a user may own only one virtual lab. The
primary user owns the lab the suite runs inside. The onboarding user owns
nothing, so it can test creating a lab from scratch. Leave the onboarding
credentials blank and those tests skip rather than fail.

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
