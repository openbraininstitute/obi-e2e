# Scenarios

Scenarios are grouped by the section of the product they cover. Inside a
section, one folder per scenario holds everything that scenario needs.

```text
scenarios/
  data/                      the Data section
    overview/
      scenario.md            the English scenario
      locators.ts            locators only this scenario uses
      overview.spec.ts       the test
    browse-morphology/
      scenario.md
      locators.ts
      browse-morphology.spec.ts
      config/scan.json       artifacts the test feeds to the app
  site/                      public pages, outside a lab
    home/
```

Sections follow the product: `data`, `workflows`, `notebooks`, `reports`,
`workspace` for the lab and project shell, and `site` for the public pages a
visitor sees. A section folder appears when its first scenario does.

A scenario that is driven by a file keeps that file under `data/`, not beside
the spec, when more than one scenario could use it. The build workflows read
their configuration from `data/scan-configs/`; see
[docs/scan-config-testing-plan.md](../docs/scan-config-testing-plan.md).

## Skipping what a deployment does not have

A workflow can be absent from one environment and present in another: it may sit
behind a feature flag, or postdate the build under test. A test says so and skips
rather than failing, because a red suite should mean the application is broken.

```ts
const unavailable = await startWorkflow(page, fixture.activity, fixture.workflow);
test.skip(unavailable !== null, unavailable ?? '');
```

The reason reaches the report, so a skipped run still says which environment was
missing what. Never skip to hide a real failure.

A locator moves to the shared `locators/` folder at the root once a second
scenario needs it. Not before.

## Writing the scenario

Plain English, Gherkin style. Describe what a **user** does and sees, never how
the code works.

| Word  | Meaning            |
| ----- | ------------------ |
| Given | starting situation |
| When  | what the user does |
| Then  | what the user sees |
| And   | one more line      |

Rules:

- Quote the exact text shown on screen: `"Simulate"`.
- One scenario checks one thing. Keep it under 10 lines.
- Per important feature: 1 to 3 happy paths and 1 to 3 error paths.

A `Then` line is an expected result. Only a product decision changes it, never a
failing run. See the healing rule in the repository README.

## Choosing the context with tags

A test declares the contexts it runs in. Every project reads the same folders and
picks its tests by tag, so one scenario can run signed out and signed in without
being written twice.

| Tag           | Runs as                                      | Covers                                                   |
| ------------- | -------------------------------------------- | -------------------------------------------------------- |
| `@public`     | nobody, signed out                           | pages any visitor can reach, outside `/app/virtual-lab/` |
| `@private`    | the primary user, inside its established lab | workflows, data, notebooks: the work inside a lab        |
| `@onboarding` | the onboarding user, owning nothing          | creating a lab, creating projects, inviting members      |
| `@spends`     | added to `@private`                          | launches something and spends the project's credits      |
| `@staging`    | added to any of the above                    | staging only; kept off production                        |
| `@production` | added to any of the above                    | production only; kept off staging                        |
| `@readonly`   | added to any of the above                    | creates nothing                                          |

Every test runs against staging and production both. `@staging` and
`@production` are for the few that cannot; leaving both off is right nearly
every time. A workflow says where it runs in its fixture's `env` list instead.

Public pages carry `@public` and run signed out, because that is what a visitor
actually sees. Checking them while signed in would test a different page.

Tags are written once in `fixtures/tags.ts` and imported, so a typo cannot
silently stop a test from running.

```ts
import { PRIVATE_READONLY } from '@fixtures/tags';

test('opens the Simulate workflows', { tag: PRIVATE_READONLY }, async ({ page }) => {
  // ...
});
```

| Constant                                                     | Tags                      |
| ------------------------------------------------------------ | ------------------------- |
| `PUBLIC`, `PRIVATE`, `ONBOARDING`                            | the context on its own    |
| `PUBLIC_READONLY`, `PRIVATE_READONLY`, `ONBOARDING_READONLY` | context plus `@readonly`  |
| `PRIVATE_SPENDS`                                             | `@private` plus `@spends` |

A scenario that should hold in more than one context carries more than one tag,
or extracts its steps into a function that each tagged test calls.

A test with no context tag never runs, and nothing warns you. See
[docs/scenario-tags.md](../docs/scenario-tags.md) for the full rules.
