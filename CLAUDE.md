# Working in this repository

E2E tests for the OBI web app. Bun 1.4, Playwright 1.62, oxlint + oxfmt.

## Before you finish

```bash
bun run check   # oxfmt --check, oxlint, tsc --noEmit
bun run test    # or a single spec while iterating
```

## Conventions

- Import `test` and `expect` from `fixtures/test.ts`, never from `@playwright/test`.
- Locators: `getByRole`, `getByLabel`, `getByText`. Never CSS classes.
  `first()` / `nth()` need a comment explaining why.
- Locators live in a page object under `pages/`. Assertions live in the spec.
- No `waitForTimeout`. Web-first assertions already retry.
- Every test is independent and leaves no data behind outside the QA lab.
- `tests/public/` needs no login. `tests/private/` reuses the saved auth state.

## Generating and healing tests

Follow `prompts/e2e-generate.md` and `prompts/e2e-heal.md`. Always open the real
application with the Playwright MCP browser before writing a locator.

**Never change an expected result to make a run pass.** A wrong result is a
product bug; report it instead.
