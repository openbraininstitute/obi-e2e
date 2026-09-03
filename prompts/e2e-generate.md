# /e2e-generate — write a test from a scenario

Usage: `/e2e-generate scenarios/<section>/<name> ["<Scenario name>"]`

## Steps

1. Read the scenario's `scenario.md`. With no scenario name, cover every
   `Scenario:` in it; with one, cover that one. If it matches none, list what is
   there and stop.
2. Reuse before adding. Read `locators/`, `fixtures/`, and the neighbouring
   scenarios in the same section. A locator moves from a scenario folder to
   `locators/` only once a second scenario needs it.
3. **Open the real application** with the Playwright MCP browser against
   `E2E_BASE_URL`. Walk the scenario. Never write a locator from the English
   alone.
4. Address elements by test id. If one is missing, add it to `core-web-app` on
   the branch under test, guard it with a unit test there, and say so in the
   report. Fall back to a role only when nothing else identifies the element,
   and say why in a comment.
5. Write the spec beside its scenario as `<name>.spec.ts`. Import from
   `@fixtures/test`, tag from `@fixtures/tags`, and put anything the test feeds
   the application under `data/`.
6. Run `bun run test <path>` until it passes twice, then `bun run check`.
7. Report the tests, the `Then` checks behind them, and any test id you added.

## Rules

- Locators: a test id first; `getByRole`/`getByLabel`/`getByText` as a stated
  fallback. Never CSS classes. `first()`/`nth()` needs a comment.
- Assert exactly: counts as well as contents, so something added or removed
  fails here rather than passing unnoticed.
- No `waitForTimeout`. Web-first assertions already retry.
- Every test is independent and leaves nothing behind outside the QA lab.
- Something a deployment does not have is a `test.skip` with the reason. Wait
  before deciding an element is absent — still rendering is not missing.
- Assert only what a user sees. Never weaken an expected result to make a run
  pass.
