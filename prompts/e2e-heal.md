# /e2e-heal — repair a test after an intentional UI change

Usage: `/e2e-heal scenarios/<section>/<name>/<name>.spec.ts`

## Hard rule

You may change **how** the test finds things. Never **what** it expects.
`Expected: done, Received: error` is a product bug — report it and stop. Only an
updated `scenario.md` changes an expected result.

## Steps

1. Run the failing test and read the error and its `Call log`, not the summary.
2. Read the trace: `bun run report`, or `playwright show-trace <trace.zip>`.
3. Open the real application with the Playwright MCP browser and find what the
   element is now.
4. Classify:
   - **Locator drift** — renamed or moved. Update the locator module. If it had
     no test id, add one to `core-web-app` rather than chasing a new label.
   - **Timing** — the element arrives late, or the page beat its own hydration.
     Wait for the thing itself; never add a sleep.
   - **Flow change** — a new step or dialog. Update the test and say that
     `scenario.md` needs the same edit.
   - **Not in this deployment** — behind a flag, or newer than the build under
     test. Turn it into a skip that names the reason.
   - **Wrong result** — stop. Report a bug with the evidence.
5. Fix, then run it three times. It must pass every time. Then `bun run check`.
6. Report what changed, why, and which scenario or test id needs an update.
