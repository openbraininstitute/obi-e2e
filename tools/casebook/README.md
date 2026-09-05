# Casebook — how to write a test

A test is a short text file. You write what should happen. A machine turns it
into a Playwright test.

You do not need to know Playwright, TypeScript, or how the page is built.

## One file, three parts

```markdown
# Morphology listing

User: lab member

## The close button keeps my search

Precondition:

1. On the "Morphology" listing

Steps:

1. Search for "Sst-IRES"
2. Note the result count
3. Open the first result
4. Click "Close"

Expected:

- The search box still contains "Sst-IRES"
- The result count is the same as noted
```

| Part           | Says                                 | Written as     |
| -------------- | ------------------------------------ | -------------- |
| `Precondition` | what is already true before we start | numbered lines |
| `Steps`        | what the user does, in order         | numbered lines |
| `Expected`     | what must be true after              | dashed lines   |

Only `Expected` is required — a case that checks nothing is not a test. Some
cases only look at what is already there, and those have no `Steps` at all.

You can repeat `Steps` and `Expected` in one case: do something, check,
do more, check again.

The heading decides what a line is, not the mark in front of it. Under
`Steps:` a dash is still a step. The checker says which mark reads better and
leaves it at that.

## The first line

`# ` and a name. One per file. Say what the file covers.

## A case

`## ` and a name. One per test. Say what the test checks, as a sentence:
"The close button keeps my search", not "Test close button".

## Who runs it

Every file needs one `User:` line. Put it under the title. A case can have its
own `User:` line to be different from the file.

| Write                          | Means                               |
| ------------------------------ | ----------------------------------- |
| `visitor`                      | not signed in, just looking         |
| `visitor, making changes`      | not signed in, changes something    |
| `lab member`                   | signed in, just looking             |
| `lab member, making changes`   | signed in, changes something        |
| `lab member, spending credits` | launches a build or a simulation    |
| `new user`                     | owns nothing yet, just looking      |
| `new user, making changes`     | creates a lab, a project, an invite |

Nothing else works. A test with a wrong `User` never runs, so the checker
stops you.

## Three habits

**Quotes mean exact words on screen.** `Click "Close"` means a thing that says
Close. `Open the first result` has no quotes, because there is nothing exact to
match.

**Say what you compare to.** "The same as before" means nothing to a machine.
Before what? Write `Note the result count` as a step. Then write `the same as
noted` in Expected.

**One line, one thing.** Each Expected line becomes one check in the test — or
a few, if one thing takes more than one look. Two unrelated things want two
lines.

## Five more lines, only when you need them

Put them under the title, or under a case.

| Line                                  | What it does                                                  |
| ------------------------------------- | ------------------------------------------------------------- |
| `Seed: name.json`                     | the file that fills the form — see below                      |
| `Page: /some/path`                    | where to start looking. A hint, never a check. A URL is fine. |
| `After: <case name>`                  | this case carries on from that one. Only under a case.        |
| `For each: configuration in the seed` | run once per configuration. Only under a case.                |
| `Only on: staging`                    | or `production`. Leave it out to run on both.                 |

Most files need none of these.

`After` must name a case written **above** in the same file. Copy the name
exactly.

### The seed

A seed is a JSON file that fills in a form. It sits next to the scenario, and it
is called `seed.json`:

```text
scenarios/workflows/build-synaptome/
  scenario.md              the cases
  seed.json                what fills the form
  build-synaptome.spec.ts  the tests
```

So you write `Seed: seed.json`. The checker looks in the same folder.

A name with a `/` in it is a path from the top of the repository instead. Use
that only when two scenarios really share one file:

```text
Seed: seed.json             the seed.json next to this scenario
Seed: shared/big.json       shared/big.json, counted from the repository root
```

## One feature, many folders

A folder holding a `scenario.md` is one scenario. A feature can have several,
one per group of tests. Give each its own folder:

```text
scenarios/workflows/build-synaptome/
  campaign/
    scenario.md
    seed.json
    campaign.spec.ts
  viewer/
    scenario.md
    seed.json
    viewer.spec.ts
```

Each folder stands alone: its own cases, its own seed, its own spec. The spec is
always named after the folder it sits in. Nothing is shared, so you can split a
long scenario in two whenever it gets hard to read.

## What the checker catches

Run it before you commit:

```bash
bun run casebook
```

It takes a path, so you can check only what you are working on:

```bash
bun run casebook scenarios/workflows
bun run casebook scenarios/workflows/simulate-ion-channel
bun run casebook scenarios/site/home/scenario.md
```

A folder is walked for `scenario.md` at any depth. A path that is not there is
named and the run fails, so a typo cannot pass quietly.

**Six things stop it.** Each one silently breaks something, so it is worth
being stopped for:

- no `User`, or a `User` that is not in the table — the test would never run
- a case with no `Expected` — the test would check nothing
- a line inside a section that it cannot place at all
- `After` naming a case that is not there, or is below, or is itself
- `Seed` naming a file that does not exist
- a `Page` with your own lab id pasted in — wrong on every run

**Everything else is a warning, and a warning never stops you.** It says what
it would rather see and moves on: a dash where a number reads better, a
typo in a field name, `xxxxx`, "before" with nothing noted, a step that
launches under a user who is not `spending credits`, a quoted value that
looks like an id, more than ten steps.

The tool is here to catch what breaks quietly. It is not here to argue about
how you write.

## Old files

A file that still has a `gherkin` block is skipped. Nothing breaks while both
formats exist. Convert a file when you touch it.

## For engineers

The validator is under `validator/`. Bun, `node:path`, and `oxc-parser` (dev)
to read a spec.

```bash
bun run casebook                                       # check every scenario
bun run casebook scenarios/workflows                   # one section
bun run casebook scenarios/workflows/build-synaptome   # one scenario
bun run casebook --json                                # for tools
bun run casebook --github                              # PR annotations
bun run casebook skeleton scenarios/workflows/build-synaptome
bun run casebook run scenarios/workflows/build-synaptome           # its spec, through Playwright
bun run casebook run scenarios/workflows/build-synaptome --headed  # flags go on to Playwright
```

### From a scenario to a spec

`skeleton` writes the shape of the spec so the generator fills in code rather
than inventing structure:

```ts
import { PRIVATE_SPENDS } from '@fixtures/tags';
import { test } from '@fixtures/test';

test.describe('Synaptome build', () => {
  test.fixme('The form will not launch until it is complete', { tag: PRIVATE_SPENDS }, async () => {
    // Precondition: Inside my project, on the Workflows page
    // Step: Start the "Build" workflow for "Synaptome"
    // Step: Choose the ME-model the seed names
    // Expect: "Generate build(s)" is disabled
  });
});
```

The spec is always named after its folder: `build-synaptome/` gets
`build-synaptome.spec.ts`. One `test.describe` per file, named after the file.
One test per case, **titled exactly as the case**. The title is what ties a
test to its case, and nothing else does — so keep them equal.

`After:` comes through as a comment. `For each:` over the seed comes through as
the loop this repo already writes. It reads the `seed.json` beside the spec:

```ts
  for (const configuration of loadSeed(import.meta.dir).cases) {
    test.fixme(`Generate a build campaign: ${configuration.name}`, { tag: PRIVATE_SPENDS }, async () => {
```

Run it again after the scenario changes. It reads the spec with oxc and:

- adds a `test.fixme` stub for every case that has no test — something new
- reports `? test with no case` for a test whose title matches no case —
  something renamed or removed
- touches nothing else

A stub nobody filled runs nothing and stays green, so `check` warns
`stubs-unfilled` on any spec still holding a `test.fixme`.

`/e2e-generate` turns the stubs into tests. `/e2e-heal` uses the same command
to see what moved. Both live in `prompts/`.
