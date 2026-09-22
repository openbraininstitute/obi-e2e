# /e2e-generate — write the tests for a scenario

Usage: `/e2e-generate scenarios/<section>/<name> ["<case title>"]`

The scenario is the contract. The test is how the app is made to keep it.

## 1. Check, then skeleton

```bash
bun run casebook scenarios/<section>/<name>
bun run casebook skeleton scenarios/<section>/<name>
```

Stop on any error from the first command — a malformed scenario is the
author's to fix, not yours to guess at.

The second writes `<name>.spec.ts` beside the scenario, or grows it: one
`test.describe` named after the file's title, one test per case, **titled
exactly as the case**. A case with no test comes in as `test.fixme` carrying
its English as comments — `After:` too, and a `For each:` over a seed comes
in as the `for (const configuration of loadSeed(import.meta.dir).cases)` loop
this repo already writes, one test per configuration. Tests already there are
not touched.

With a case title given, work on that test only. With none, work on every
`test.fixme` in the file.

**Never rename a test.** The title is what ties it to its case; rename either
side and the link is gone.

## 2. Read before writing

- The scenario. `User:` picks the tag (already set in the stub). `Seed:` names
  the `seed.json` beside the spec that `loadSeed` reads and `ScanConfigDriver`
  fills the form from. `After:` names the case whose steps
  come first. `For each:` means one test per entry in the seed's `cases[]`.
  `Page:` says where to start looking, and nothing more.
- `fixtures/` — what exists so you do not write it again. The root holds the
  vocabulary a spec writes with: `test.ts` (the `test` object, with
  `workspace`), `tags.ts`, `viewport.ts`, `routes.ts`, `entity-types.ts`,
  `data-types.ts`. Beside it, `steps/` is what a spec does to a page
  (`choose-species.ts`, `listing-columns.ts`, `workflows.ts`, `credits.ts`,
  `feature-flags.ts`), `checks/` is the shared assertions (`filter.ts`,
  `pagination.ts`, `campaign-output.ts`), and `scan-config/` is the editor.
  `run/` belongs to the harness, not to a spec.
- `locators/` — how the app is addressed: `listing.ts`, `data.ts`,
  `data-view.ts`, `scan-config.ts`, `viewer.ts`, `workflows.ts`, `atlas.ts`,
  `column-filter.ts`, `navigation.ts`, and `helpers.ts` underneath them all.
  A locator this scenario alone needs goes in its own `locators.ts`; it moves
  to `locators/` when a second scenario needs it. Read `locators/README.md`.
- The neighbouring specs in the same section. Copy their shape.
- `CLAUDE.md`, for the rules every spec keeps.

## 3. Open the real application

Walk every step of the case in the real app, with the Playwright CLI (`CLAUDE.md`
→ _Browsing the app_ has the signed-in recipe; the `playwright-cli` skill has the
commands). **Never write a locator from the English alone.** The words in quotes
are what is on screen; find them there.

```bash
bun run auth && source .env.staging
playwright-cli -s=obi open
playwright-cli -s=obi state-load .e2e-runs/live/auth/primary.json
playwright-cli -s=obi goto "$E2E_BASE_URL/app/virtual-lab"
```

Then, per step: `find "<the quoted words>"` for the element, `click`/`fill`/`select`
on its ref, `find` again for what the `Expect` line names. Search the snapshot with
`find`; take a full `snapshot` only when you are lost. `console` and `requests` say
whether a missing element is a locator problem or a backend one — a product bug is
reported, not worked around.

Address elements by test id first. The snapshot does not show test ids, so read
them off the page:

```bash
playwright-cli -s=obi --raw eval "JSON.stringify([...document.querySelectorAll('[data-testid]')].map(e=>e.getAttribute('data-testid')))"
playwright-cli -s=obi --raw eval "el => el.getAttribute('data-testid')" e41
```

If one is missing, add it to `core-web-app` on the branch under test, guard it
with a unit test there, and say so in the report. Fall back to `getByRole` /
`getByLabel` / `getByText` only when nothing else identifies the element —
`--raw generate-locator <ref>` writes that fallback for you — and say why in a
comment. Never CSS classes. `first()` / `nth()` needs a comment.

Close the session when the spec is written: `playwright-cli -s=obi close`.

## 4. Write the test

Turn each comment in the stub into code, in order, and delete the comment.

- **Precondition** — the state the test starts in. When every case in the
  file shares it, it is the `beforeEach`; otherwise it is the top of the test.
  `After: X` means X's steps run first: put them in a helper both tests call
  (`openEditor` in `build-synaptome.spec.ts` is the pattern), and do not
  re-assert X's expectations.
- **Step** — an action. One line of English, one or two lines of code.
- **Expect** — one assertion per line, kept in the order written. Assert
  exactly: a count as well as its contents, so something added or removed
  fails here rather than passing unnoticed. Quoted words are asserted as
  written. "Note the X" becomes a `const`; "as noted" compares with it.
- **For each** — `for (const configuration of fixture.cases)` around a test
  titled `` `${case title}: ${configuration.name}` ``.

Then change `test.fixme` to `test`. Leave nothing as `fixme` without a reason
in the report.

Rules that hold in every spec: import `test` and `expect` from
`@fixtures/test`; tags from `@fixtures/tags`; import by alias, never `../`;
no `waitForTimeout`, the web-first assertions already retry; every test
independent, and nothing left behind outside the QA lab. Something a
deployment does not have is a `test.skip` naming the reason — wait before
deciding an element is absent, still rendering is not missing.

If a step cannot be done as written, say so. Do not invent a step, and do not
weaken an expectation to make it pass.

## 5. Finish

```bash
bun run casebook run scenarios/<section>/<name>   # until it passes twice
bun run check
```

Report: each case and the test it became, every `Expect` line and the
assertion behind it, any test id you added to `core-web-app`, and anything
left as `fixme` with why.
