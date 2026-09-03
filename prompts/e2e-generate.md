# /e2e-generate — write a test from a scenario

Usage: `/e2e-generate specs/<file>.md "<Scenario name>"`

## Steps

1. Read the named scenario in the spec file. If the scenario name does not match
   exactly one scenario, stop and list the ones you found.
2. Read `pages/`, `fixtures/`, and neighbouring specs in `tests/`. Reuse existing
   page objects and fixtures before adding new ones.
3. **Look at the real application** with the Playwright MCP browser against
   `E2E_BASE_URL`. Walk the scenario and read the accessible names of the
   elements involved. Never write a locator from the English text alone.
4. Write the test under `tests/public/` (no login needed) or `tests/private/`
   (signed in). Import `test`/`expect` from `fixtures/test.ts`.
5. Add or extend a page object for any screen the test touches. Locators live in
   the page object; assertions live in the spec.
6. Run it: `bun run test <path>`. Fix and rerun until it passes twice in a row.
7. Report the test name and the `Then` checks so the author can confirm they
   match the scenario.

## Rules

- Locators: `getByRole`, `getByLabel`, `getByText`. Never CSS classes, never
  `first()`/`nth()` without a comment saying why.
- No `waitForTimeout`. Use web-first assertions and `waitFor`.
- Every test is independent. No test relies on another having run.
- Tag the test with the scenario's tags.
- Assert only what the user sees. Do not assert internal services.
- Never weaken an expected result to make a run pass.
