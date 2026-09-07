# Who runs a scenario

Every test needs to know one thing before it starts: **who is signed in.**

You say it once, in plain English, at the top of the scenario:

```text
User: authenticated
```

The spec then carries the matching constant, and that is what the test runner
reads:

```ts
import { AUTHENTICATED } from '@fixtures/tags';

test('See the Morphology table', { tag: AUTHENTICATED }, async ({ page }) => {
```

`casebook skeleton` writes that constant for you from the `User:` line, so the
two never drift apart.

## The users

| `User:`         | Constant        | Signed in as                                         |
| --------------- | --------------- | ---------------------------------------------------- |
| `visitor`       | `VISITOR`       | nobody                                               |
| `authenticated` | `AUTHENTICATED` | the primary user, in their existing lab              |
| `credits`       | `CREDITS`       | the same, and it launches something the lab pays for |
| `onboarding`    | `ONBOARDING`    | the second user, who owns nothing: signing up        |

**A test with no user never runs.** No project picks it up and nothing warns
you, which is why `casebook` treats a missing `User:` as an error.

## How to choose

1. Can a signed-out visitor see this page? → **visitor**
2. Is it signing up, or the pages a brand new user meets? → **onboarding**
3. Does it launch something the project pays for? → **credits**
4. Otherwise → **authenticated**

Whether a test only looks or also writes is not part of this. It said nothing
about which project ran the test, and a label that has to be kept true by hand
goes stale the first time someone adds a click.

## What the constants become

A constant is just a list of `@` labels. `CREDITS` is
`['@private', '@credits']`.

| Label         | Means                                                     |
| ------------- | --------------------------------------------------------- |
| `@public`     | run signed out                                            |
| `@private`    | run as the primary user                                   |
| `@onboarding` | run as the onboarding user                                |
| `@credits`    | the test spends credits, so it waits for a funded project |
| `@staging`    | run on staging **only**                                   |
| `@production` | run on production **only**                                |

`@credits` is carried on top of `@private`: the same user, waiting for a funded
project. The `private` project leaves those tests out and the `credits` project
picks them up, so a lab with no money loses only the tests that need it.

Playwright reserves none of these words. They mean something only because
[playwright.config.ts](../playwright.config.ts) turns each one into a project.

## Deployments

**Every test runs on both deployments unless it says otherwise.** That is what
you want nearly every time. Add `@staging` or `@production` only for a test that
genuinely cannot run on the other one.

A workflow test says nothing about deployments. Its seed does:

```jsonc
{ "activity": "build", "env": ["staging", "production"] }
```

An empty `env` means the workflow runs nowhere yet. Which deployments offer a
workflow is a fact about the release, not about the test, so it belongs beside
the configuration. See [workflow-tests.md](workflow-tests.md).

## Running a subset

```bash
bun run test --grep @credits           # only the tests that spend
bun run test --grep-invert @credits    # everything that does not
bun run test scenarios/site            # a path, which never goes stale
```

Which deployment a run targets comes from `E2E_BASE_URL`:

```bash
E2E_BASE_URL=https://www.openbraininstitute.org bun run test
```

## Common mistakes

| Mistake                                       | What happens                              |
| --------------------------------------------- | ----------------------------------------- |
| No `User:` line                               | `casebook` refuses the file               |
| A tag written without `@`                     | Playwright refuses to start               |
| `@staging` added out of caution               | the test never guards production again    |
| `User: authenticated` on a test that launches | it runs before the credit check and fails |
