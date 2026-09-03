# Working in this repository

E2E tests for the OBI web app. Bun 1.4, Playwright 1.62, oxlint + oxfmt.

Tests run under Bun via `bun --bun playwright`, so Bun APIs work in test code.
Always run through the package scripts; `bunx playwright` falls back to Node
workers where the `Bun` global does not exist.

## Before you finish

```bash
bun run check   # oxfmt --check, oxlint, tsc --noEmit
bun run test    # or a single spec while iterating
```

## Conventions

- Import `test` and `expect` from `fixtures/test.ts`, never from `@playwright/test`.
- Locators: `getByRole`, `getByLabel`, `getByText`. Never CSS classes.
  `first()` / `nth()` need a comment explaining why.
- Locators live in the scenario's own `locators.ts`. Move one to the root
  `locators/` folder only once a second scenario needs it.
- Assertions live in the spec, never in a locator module.
- No `waitForTimeout`. Web-first assertions already retry.
- Every test is independent and leaves no data behind outside the QA lab.
- A test declares its context with a tag. `@public` runs signed out. `@private`
  runs as the primary user inside its established lab. `@onboarding` runs as the
  second user, which creates labs, projects and invites, and cleans up after itself.

## Generating and healing tests

Follow `prompts/e2e-generate.md` and `prompts/e2e-heal.md`. Always open the real
application with the Playwright MCP browser before writing a locator.

**Never change an expected result to make a run pass.** A wrong result is a
product bug; report it instead.
