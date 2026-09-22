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

- Import `test` and `expect` from `@fixtures/test`, never from `@playwright/test`.
- Import by alias (`@/`, `@fixtures/`, `@locators/`, `@api/`), never `../../..`.
- Tags come from `@fixtures/tags`. Entity types come from `@fixtures/entity-types`,
  and listing slugs are derived from them with `kebabCase`.
- Locators: `getByTestId` first. Add the test id to core-web-app when it is
  missing; where a component cannot carry one, use a data attribute. Fall back
  to `getByRole` / `getByLabel` / `getByText` with `.or()` only until the id
  ships — staging lags the app, and a test id-only locator fails there. Never
  CSS classes. `first()` / `nth()` need a comment explaining why.
  Keep the two halves of an `.or()` on one element: when the fallback is an
  ancestor of the marked element, both match and the locator is not strict.
- Locators live in the scenario's own `locators.ts`. Move one to the root
  `locators/` folder only once a second scenario needs it.
- Assertions live in the spec, never in a locator module.
- No `waitForTimeout`. Web-first assertions already retry.
- Every test is independent and leaves no data behind outside the QA lab.
- A test declares its context with a tag, imported from `@fixtures/tags`.
  `VISITOR` (`@public`) runs signed out. `AUTHENTICATED` (`@private`) runs as the
  primary user inside the project the run created for itself. `ONBOARDING`
  (`@onboarding`) runs as the second user, which signs up, creates labs and
  projects, and cleans up after itself. Use `CREDITS` (`@private @credits`) when
  a test launches something the project pays for.
- Every test runs against staging and production. Add `@staging` or
  `@production` only when a test cannot run on the other. A scan-config workflow
  says where it runs in its fixture's `env` list, never with a tag.

## Browsing the app

Use the **Playwright CLI**, never the Playwright MCP server (it is gone from
this repo): it is headless, the daemon keeps one browser alive across commands,
and only the snapshot you ask for enters context. The `playwright-cli`
skill is the reference; `make install` writes it, to `.claude/skills/` and to
`.agents/skills/` for every other agent. Without
the global `playwright-cli` command, `bunx --bun playwright cli <command>` does
the same — never `bunx playwright cli`, that is the Node fallback this repo
bans.

Browse signed in, in a named session, so no command touches another agent's
browser:

```bash
bun run auth                     # writes .e2e-runs/live/auth/{primary,onboarding}.json
source .env.staging              # or .env.production, for E2E_BASE_URL
playwright-cli -s=obi open
playwright-cli -s=obi state-load .e2e-runs/live/auth/primary.json
playwright-cli -s=obi goto "$E2E_BASE_URL/app/virtual-lab"
```

An access token lives 60 minutes: a `/app/log-in` redirect means the state is
stale, so re-run `bun run auth` rather than signing in through the browser.
Finish with `playwright-cli -s=obi close`.

On the page:

```bash
playwright-cli -s=obi find "Add to library"       # search the snapshot, don't dump it
playwright-cli -s=obi --raw eval "JSON.stringify([...document.querySelectorAll('[data-testid]')].map(e=>e.getAttribute('data-testid')))"
playwright-cli -s=obi --raw eval "el => el.getAttribute('data-testid')" e41
playwright-cli -s=obi --raw generate-locator e41  # the locator, as a spec would write it
playwright-cli -s=obi click e41
playwright-cli -s=obi console                     # errors behind a blank page
playwright-cli -s=obi requests                    # the 500 behind a stuck tab
```

Test ids do not show in the snapshot — the `eval` above is how you confirm one
exists before writing `getByTestId`, and how you find that it does not.

## Generating and healing tests

Follow `prompts/e2e-generate.md` and `prompts/e2e-heal.md`. Always open the real
application with the Playwright CLI before writing a locator.

**Never change an expected result to make a run pass.** A wrong result is a
product bug; report it instead.
