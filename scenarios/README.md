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
| `@smoke`      | added to any of the above                    | also runs against production                             |
| `@readonly`   | added to any of the above                    | creates nothing                                          |

Public pages carry `@public` and run signed out, because that is what a visitor
actually sees. Checking them while signed in would test a different page.

```ts
test('opens the Simulate workflows', { tag: ['@private'] }, async ({ page }) => {
  // ...
});
```

A scenario that should hold in more than one context carries more than one tag,
or extracts its steps into a function that each tagged test calls.

A test with no context tag never runs, and nothing warns you. See
[docs/scenario-tags.md](../docs/scenario-tags.md) for the full rules.
