# /e2e-heal — repair a test after an intentional UI change

Usage: `/e2e-heal tests/<file>.spec.ts`

## Hard rule

The AI may update **how** the test finds things. It may never change **what** the
test expects. `Expected: Running, Actual: Failed` is a product bug — report it and
stop. Only an updated scenario changes an expected result.

## Steps

1. Run the failing test and read the actual error, not just the summary.
2. Open the trace: `bun run report`, or `playwright show-trace <trace.zip>`.
3. Open the real application with the Playwright MCP browser and find what the
   element is called now.
4. Classify the failure:
   - **Locator drift** (renamed button, moved control) → update the page object.
   - **Flow change** (an extra step, a new dialog) → update the test steps, and say
     that the scenario in `specs/` needs the same edit.
   - **Wrong result** (the product does the wrong thing) → stop. Report a bug.
5. Fix, then run the test three times. It must pass every time.
6. Summarise: what changed, why, and which scenario file needs an update.
