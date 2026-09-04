# Tags: choosing who runs a scenario

A tag is a label that starts with `@`. It answers one question:

> **Who is signed in when this test runs, and where may it run?**

Nothing else. A tag never changes what the test checks.

## The two places a tag is written

You write the same tags twice.

| File          | Looks like                                          | Who reads it    |
| ------------- | --------------------------------------------------- | --------------- |
| `scenario.md` | `@private @readonly` above the line `Scenario: ...` | people          |
| `*.spec.ts`   | `{ tag: ['@private', '@readonly'] }`                | the test runner |

The English one documents the intent. The TypeScript one is the one that
actually decides anything. If they disagree, the TypeScript one wins.

## The format `scenario.md` uses

**Gherkin** — the language Cucumber invented. We borrow the syntax only. No
Cucumber runs here; the `.md` file is read by people, and a developer or the AI
turns it into a Playwright test.

We use a small part of it:

| Keyword                   | Meaning                                             |
| ------------------------- | --------------------------------------------------- |
| `Feature:`                | the group, once at the top                          |
| `Scenario:`               | one case                                            |
| `Given` / `When` / `Then` | starting point / what the user does / what they see |
| `And`                     | one more line of the same kind                      |
| `@tag`                    | on its own line, directly above `Scenario:`         |

Gherkin also has `Background`, `Scenario Outline`, `Examples`, `Rule` and `But`.
We do not use them. Keep a scenario under 10 lines instead.

Full reference: <https://cucumber.io/docs/gherkin/reference>.

## Reading the TypeScript line

```ts
test('switches to the model data types', { tag: ['@private', '@readonly'] }, async ({ page }) => {
  // ...
});
```

`test()` takes three things:

1. the title,
2. an **options** object — this is where `tag` lives,
3. the test body.

`tag` accepts one string (`{ tag: '@private' }`) or a list of strings. Every tag
must start with `@`, or Playwright refuses to start.

To tag every test in a block at once, put it on the `describe`:

```ts
test.describe('Data page', { tag: ['@private', '@readonly'] }, () => {
  // every test inside inherits both tags
});
```

## The tags you may use

### Context tags — pick at least one

This is the "who is signed in" part. Each one matches a project in
[playwright.config.ts](../playwright.config.ts).

| Tag           | Signed in as                            | Use it for                                          |
| ------------- | --------------------------------------- | --------------------------------------------------- |
| `@public`     | nobody                                  | pages a visitor sees, outside `/app/virtual-lab/`   |
| `@private`    | the primary user, in their existing lab | the work inside a lab: data, workflows, notebooks   |
| `@onboarding` | the onboarding user, who owns nothing   | creating a lab, creating projects, inviting members |

**A test with no context tag never runs.** No project picks it up, and nothing
warns you. This is the mistake to watch for.

A test may carry two context tags. It then runs twice, once per user.

### Extra tags — add zero or more

| Tag           | Means                                                         |
| ------------- | ------------------------------------------------------------- |
| `@spends`     | this test launches something and spends the project's credits |
| `@staging`    | run this on staging **only** — keep it off production         |
| `@production` | run this on production **only** — keep it off staging         |
| `@readonly`   | this test creates nothing and deletes nothing                 |

**Every test runs on both deployments unless it says otherwise.** That is the
default and almost every test wants it. `@staging` and `@production` are for the
few that cannot: a feature that has not reached production yet, or one kept off
it deliberately. The config excludes the other deployment's tag, so a local run
against production skips exactly what CI skips.

`@spends` moves a test into its own project, which waits for a funded project.
A lab that cannot pay stops those tests and leaves everything that only reads to
run. Use `PRIVATE_SPENDS` from `@fixtures/tags` rather than writing it by hand.

`@readonly` is a promise you write down for the next reader; filter on it by
hand with `--grep @readonly`.

### Workflows do not use the deployment tags

A scan-config workflow test says where it runs in its fixture, not in a tag:

```jsonc
{ "activity": "build", "env": ["staging", "production"], ... }
```

An empty `env` means nowhere yet. Which deployments offer a workflow is a fact
about the release rather than about the test, so it belongs with the fixture.
See [scan-config-testing-plan.md](scan-config-testing-plan.md).

### No tool knows these words

Playwright reserves no tag names. It takes any string starting with `@`, adds it
to the test title, and lets `--grep` match it. `@readonly` and `@banana` behave
the same way. All the meaning comes from two files we wrote:
[playwright.config.ts](../playwright.config.ts) and
[.github/workflows/e2e.yml](../.github/workflows/e2e.yml).

There is no tag for a short subset. A quick check is a path, not a label: name
the scenario you want and Playwright runs it, and nothing goes stale the way a
list of blessed tests does.

```bash
bun run test scenarios/site
```

`@public`, `@private` and `@onboarding` are ours, named after our two test
users.

## So what does `{ tag: ['@private', '@readonly'] }` mean?

> Run signed in as the primary user, inside their existing lab.
> The test only looks at things. It changes no data.

## How to choose — read top to bottom, stop at the first yes

1. Can a signed-out visitor see this page? → **`@public`**
2. Does the test create a lab, a project or an invite? → **`@onboarding`**
3. Otherwise → **`@private`**

Then:

4. Does the test only read? → add **`@readonly`**
5. Does it launch something that costs credits? → use **`PRIVATE_SPENDS`**
6. Does it belong to one deployment only? → add **`@staging`** or
   **`@production`**. Leave both off unless you know it cannot run on the other,
   because both is the right answer nearly every time.

## Running tests by tag

```bash
bun run test --grep @private
```

```bash
bun run test --grep @readonly
```

```bash
bun run test --grep-invert @onboarding
```

The deployment a run targets comes from `E2E_BASE_URL`, or `E2E_ENV` where the
host does not say. So this runs the production selection from your machine:

```bash
E2E_BASE_URL=https://www.openbraininstitute.org bun run test
```

`--grep` and the project's own filter both apply. `--grep @readonly` runs the
read-only tests of every project; it does not make a project of its own.

## Common mistakes

| Mistake                           | What happens                                                     |
| --------------------------------- | ---------------------------------------------------------------- |
| No context tag                    | the test silently never runs                                     |
| Tag written without `@`           | Playwright refuses to start                                      |
| Tag only in `scenario.md`         | the test silently never runs                                     |
| `@staging` added out of caution   | the test never guards production again                           |
| `@spends` missing on a launch     | it runs before the credit check, and fails when the lab is empty |
| `@readonly` on a test that writes | the label lies; the next reader trusts it                        |
