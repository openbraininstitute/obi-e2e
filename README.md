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

| Path          | What lives there                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `scenarios/`  | grouped by product section, then one folder per scenario with its text, locators, test and artifacts |
| `locators/`   | locators shared by more than one scenario                                                            |
| `fixtures/`   | environment config, sign-in, and the extended `test` object                                          |
| `setup/`      | one sign-in per user, saved for every later test                                                     |
| `api/`        | HTTP helpers for arranging test data                                                                 |
| `prompts/`    | what the AI does for `/e2e-generate` and `/e2e-heal`                                                 |
| `scripts/ci/` | result summary and Teams card                                                                        |

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

### Making the flow reply

Edit the flow in Power Automate. Today it posts one card. Change it to:

1. **Post card in a chat or channel** — set the card to
   `triggerBody()?['cards'][0]`. Keep this action's **Message ID** output.
2. **Apply to each** — set the input to `skip(triggerBody()?['cards'], 1)`.
3. Inside the loop, **Reply with a message in a channel** — use the Message ID
   from step 1, and the current item as the card.

Then set `TEAMS_LAYOUT=thread` here. Nothing else changes.

The alternative is Microsoft Graph
(`POST /teams/{id}/channels/{id}/messages/{id}/replies`), which threads properly
but needs an app registration and the `ChannelMessage.Send` permission.

## Before the tests run

Every run first checks that the backend services are healthy and reports their
versions. A service that is down fails there, with its name, instead of showing
up as a wall of broken tests. The launch system is skipped because it answers
only inside the VPC. See `api/README.md`.

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
