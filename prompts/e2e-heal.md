# /e2e-heal — bring a test back in line with its scenario

Usage: `/e2e-heal scenarios/<section>/<name>`

## The rule

You may change **how** a test finds things. Never **what** it expects. Only an
updated `scenario.md` changes an expected result. If the app no longer does
what the scenario says, that is a product bug: report it and stop.

## 1. See what moved

```bash
bun run casebook scenarios/<section>/<name>
bun run casebook skeleton scenarios/<section>/<name>
```

The second prints, per spec:

- `+ <title>` — a case with no test. **Something new.** It is now a
  `test.fixme` stub with its English as comments. Write it, following
  `prompts/e2e-generate.md`.
- `? test with no case: <title>` — a test whose title matches no case.
  **Something old changed.** Find the case it was: renamed → rename the test
  to match, exactly; removed → delete the test. Say which you did.

Tests are tied to cases by title and nothing else. Keep them equal.

## 2. Compare every test with its case

For each test that has a case, read the case's `Steps` and `Expected` against
the test body, top to bottom.

- An `Expected` line with no assertion → add the assertion.
- An `Expected` line that changed → change the assertion to match it.
- An assertion no `Expected` line asks for → delete it, or add the line to the
  scenario if it was always meant.
- A `Step` that changed → change the action.

That is a regenerate of the parts that moved. Leave the rest as it is.

## 3. Run, and read the failure

```bash
bun run casebook run scenarios/<section>/<name>
```

For a failure, read the error and its `Call log`, then the trace (`bun run
report`, or `playwright show-trace <trace.zip>`). On CI there is no trace —
`error-context.md` is the evidence. Then open the real application with the
Playwright CLI (`CLAUDE.md` → _Browsing the app_) and find what the element is
now:

```bash
bun run auth && source .env.staging
playwright-cli -s=obi open
playwright-cli -s=obi state-load .e2e-runs/live/auth/primary.json
playwright-cli -s=obi goto "$E2E_BASE_URL/<the page the test was on>"
playwright-cli -s=obi find "<what the locator was looking for>"
playwright-cli -s=obi console   # and `requests`, before blaming the locator
```

Classify:

- **Locator drift** — renamed or moved. Update the locator. If it had no test
  id, add one to `core-web-app` rather than chasing a new label.
- **Timing** — the element arrives late, or the page beat its own hydration.
  Wait for the thing itself; never add a sleep.
- **Flow change** — a new step or dialog. Update the test, and say that
  `scenario.md` needs the same edit.
- **Not in this deployment** — behind a flag, or newer than the build under
  test. Turn it into a skip that names the reason.
- **Wrong result** — stop. Report a bug with the evidence.

## 4. Finish

Close the browser (`playwright-cli -s=obi close`). Run the test three times:
it must pass every time. Then `bun run check`.

Report what changed, why, which classification each fix was, and which
scenario line or test id needs an update.
