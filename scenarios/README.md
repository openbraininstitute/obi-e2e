# Scenarios

A scenario is one folder. It holds the English description and the test that
implements it.

```text
scenarios/
  site/                       public pages, outside a lab
    home/
      scenario.md             the English scenario
      locators.ts             locators only this scenario uses
      home.spec.ts            the test
  data/                       the Data section
    cell-morphology/
      browse/                 the listing
      view/                   one entity's page
  workflows/                  the Workflows section
    build-synaptome/
      scenario.md
      seed.json               the form values the test fills in
      build-synaptome.spec.ts
```

Three sections exist today: `data`, `site` and `workflows`. A new one appears
when its first scenario does.

Nothing is shared between folders, so a scenario can be read, moved or deleted
on its own. A locator moves to the top-level `locators/` folder only once a
second scenario needs it. Not before.

A workflow scenario is driven by a file beside it, always called `seed.json`.
See [docs/workflow-tests.md](../docs/workflow-tests.md).

## Writing the scenario

Write what a **user** does and sees. Never how the code works.

A file is a title, a `User:` line, and one `## ` heading per test:

```markdown
# What the listing remembers

User: authenticated

## The close button brings the listing back as it was

Precondition:

1. On the "Morphology" listing

Steps:

1. Search for "Sst-IRES", and note how many results it leaves
2. Open one result, and go through to its details page
3. Close the details page

Expected:

- The search box still reads "Sst-IRES"
- The number of results is the same as noted
```

Three parts. `Steps:` and `Expected:` are required. `Precondition:` is optional.

| Part           | Holds                         |
| -------------- | ----------------------------- |
| `Precondition` | where the user starts         |
| `Steps`        | what the user does, in order  |
| `Expected`     | what the user sees afterwards |

Rules:

- Quote the exact words on screen: `Click "Close"`.
- One case checks one thing. Keep it under ten steps.
- An `Expected` line only changes when the product changes. Never to make a
  failing run pass.

The test title must match the `## ` heading **exactly**. That is the only thing
tying a case to its test.

Other lines you can add under the title, or under one case:

| Line        | Says                                           |
| ----------- | ---------------------------------------------- |
| `Page:`     | where the test starts, e.g. `/`                |
| `Seed:`     | the file that fills the form, e.g. `seed.json` |
| `Only on:`  | `staging` or `production`, when only one works |
| `After:`    | the case this one continues from               |
| `For each:` | one test per configuration in the seed         |

Check your file before you commit:

```bash
bun run casebook scenarios
```

The full format is in [tools/casebook/README.md](../tools/casebook/README.md).

## Who runs it

Each test says who is signed in. The `User:` line does this in the scenario, and
a tag does it in the spec.

| `User:`         | Constant        | Signed in as                                   |
| --------------- | --------------- | ---------------------------------------------- |
| `visitor`       | `VISITOR`       | nobody                                         |
| `authenticated` | `AUTHENTICATED` | the primary user, in the run's own project     |
| `credits`       | `CREDITS`       | the same, and it launches something that costs |
| `onboarding`    | `ONBOARDING`    | the second user, who owns nothing              |

```ts
import { AUTHENTICATED } from '@fixtures/tags';

test('opens the Simulate workflows', { tag: AUTHENTICATED }, async ({ page }) => {
  // ...
});
```

Each constant is a list of labels, and Playwright uses them to pick a project.
`CREDITS` is `['@private', '@credits']`: the same user as `AUTHENTICATED`, but it
waits for a funded project.

**A test with no tag never runs, and nothing warns you.** That is why `casebook`
treats a missing `User:` as an error. Full rules:
[docs/scenario-tags.md](../docs/scenario-tags.md).

## Which deployment

Every test runs on staging **and** production. Add `@staging` or `@production`
only when a test truly cannot run on the other one.

A workflow says nothing about this. Its seed does, in an `env` list.

## Skipping what a deployment does not have

A workflow can be missing from one deployment: behind a feature flag, or newer
than the build under test. The test skips and says why, because a red suite
should mean the application is broken.

A workflow scenario skips in two places:

```ts
// the whole file, when the seed says this deployment does not offer it
test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

// one test, when the project holds nothing to work from
const missing = await chooseEntities(page, fixture.selection);
test.skip(missing !== null, missing ?? '');
```

The reason reaches the report, so a skipped run still says what was missing.
Never skip to hide a real failure.

## Every listing starts from all species

The species picker narrows a listing. The app remembers that choice for the
**user**, not for the tab. Every signed-in test uses the same user, so whichever
species another test picked last is still in force — and a listing with nothing
for it shows "0 results" on a page that otherwise looks fine.

So `routes.dataEntity` asks for all species in the URL, which beats the saved
choice. A scenario that opens a listing needs to say nothing. One that means to
change the species says so and picks it, the way `species-and-regions` does.
