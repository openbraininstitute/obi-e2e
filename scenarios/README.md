# Scenarios

One folder per scenario. Everything a scenario needs lives inside it.

```text
scenarios/
  workflow-build-memodel/
    scenario.md          # the English scenario
    locators.ts          # locators only this scenario uses
    workflow.spec.ts     # the test
    config/scan.json     # artifacts the test feeds to the app
```

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

| Tag           | Runs as                             | Project          |
| ------------- | ----------------------------------- | ---------------- |
| `@public`     | nobody, signed out                  | `public`         |
| `@private`    | the primary user, inside its lab    | `private`        |
| `@onboarding` | the onboarding user, owning nothing | `onboarding`     |
| `@smoke`      | also runs against production        | any of the above |
| `@readonly`   | creates nothing                     | any of the above |

```ts
test('opens the Simulate workflows', { tag: ['@private'] }, async ({ page }) => {
  // ...
});
```

A scenario that should hold in more than one context carries more than one tag,
or extracts its steps into a function that each tagged test calls.
