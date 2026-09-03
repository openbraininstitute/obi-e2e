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

| Tag         | Means                                              |
| ----------- | -------------------------------------------------- |
| `@smoke`    | also run this every morning against **production** |
| `@readonly` | this test creates nothing and deletes nothing      |

`@smoke` is the only extra tag a job filters on today. `@readonly` is a promise
you write down for the next reader; you can still filter on it by hand with
`--grep @readonly`.

### No tool knows these words

Playwright reserves no tag names. It takes any string starting with `@`, adds it
to the test title, and lets `--grep` match it. `@smoke` and `@banana` behave the
same way. All the meaning comes from two files we wrote:
[playwright.config.ts](../playwright.config.ts) and
[.github/workflows/e2e.yml](../.github/workflows/e2e.yml).

`@smoke` is still worth keeping: a _smoke test_ is standard industry vocabulary
for a thin, fast check that a build is alive, and `@smoke` is the usual tag name
for it. `@public`, `@private` and `@onboarding` are ours, named after our two
test users.

## So what does `{ tag: ['@private', '@readonly'] }` mean?

> Run signed in as the primary user, inside their existing lab.
> The test only looks at things. It changes no data.

## How to choose — read top to bottom, stop at the first yes

1. Can a signed-out visitor see this page? → **`@public`**
2. Does the test create a lab, a project or an invite? → **`@onboarding`**
3. Otherwise → **`@private`**

Then:

4. Does the test only read? → add **`@readonly`**
5. Should it also guard production daily? → add **`@smoke`** — but only if it
   creates nothing outside the QA lab and project.

## Running tests by tag

```bash
bun run test --grep @private
```

```bash
bun run test:smoke
```

```bash
bun run test --grep-invert @onboarding
```

`--grep` and the project's own filter both apply. `--grep @readonly` runs the
read-only tests of every project, not a fourth project of its own.

## Common mistakes

| Mistake                           | What happens                              |
| --------------------------------- | ----------------------------------------- |
| No context tag                    | the test silently never runs              |
| Tag written without `@`           | Playwright refuses to start               |
| Tag only in `scenario.md`         | the test silently never runs              |
| `@smoke` on a test that writes    | it creates data on production             |
| `@readonly` on a test that writes | the label lies; the next reader trusts it |
