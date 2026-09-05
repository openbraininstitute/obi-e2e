# Who runs a scenario

Every test needs to know one thing before it starts: **who is signed in.**

You say it once, in plain English, at the top of the scenario:

```text
User: lab member
```

The spec then carries the matching constant, and that is what the test runner
reads:

```ts
import { PRIVATE_READONLY } from '@fixtures/tags';

test('See the Morphology table', { tag: PRIVATE_READONLY }, async ({ page }) => {
```

`casebook skeleton` writes that constant for you from the `User:` line, so the
two never drift apart.

## The users

| `User:`                        | Constant              | Signed in as                            |
| ------------------------------ | --------------------- | --------------------------------------- |
| `visitor`                      | `PUBLIC_READONLY`     | nobody                                  |
| `visitor, making changes`      | `PUBLIC`              | nobody                                  |
| `lab member`                   | `PRIVATE_READONLY`    | the primary user, in their existing lab |
| `lab member, making changes`   | `PRIVATE`             | the same                                |
| `lab member, spending credits` | `PRIVATE_SPENDS`      | the same, and it costs credits          |
| `new user`                     | `ONBOARDING_READONLY` | the onboarding user, who owns nothing   |
| `new user, making changes`     | `ONBOARDING`          | the same                                |

**A test with no user never runs.** No project picks it up and nothing warns
you, which is why `casebook` treats a missing `User:` as an error.

## How to choose

1. Can a signed-out visitor see this page? → **visitor**
2. Does it create a lab, a project or an invite? → **new user**
3. Otherwise → **lab member**

Then:

4. Does it only look, and change nothing? → leave it as it is.
5. Does it change data? → add **, making changes**
6. Does it launch something that costs credits? → **, spending credits**

## What the constants become

A constant is just a list of `@` labels. `PRIVATE_READONLY` is
`['@private', '@readonly']`.

| Label         | Means                                                     |
| ------------- | --------------------------------------------------------- |
| `@public`     | run signed out                                            |
| `@private`    | run as the primary user                                   |
| `@onboarding` | run as the onboarding user                                |
| `@readonly`   | the test creates nothing and deletes nothing              |
| `@spends`     | the test spends credits, so it waits for a funded project |
| `@staging`    | run on staging **only**                                   |
| `@production` | run on production **only**                                |

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
bun run test --grep @readonly          # only the tests that change nothing
bun run test --grep-invert @onboarding # everything but the onboarding user
bun run test scenarios/site            # a path, which never goes stale
```

Which deployment a run targets comes from `E2E_BASE_URL`:

```bash
E2E_BASE_URL=https://www.openbraininstitute.org bun run test
```

## Common mistakes

| Mistake                           | What happens                                  |
| --------------------------------- | --------------------------------------------- |
| No `User:` line                   | `casebook` refuses the file                   |
| A tag written without `@`         | Playwright refuses to start                   |
| `@staging` added out of caution   | the test never guards production again        |
| Missing `, spending credits`      | it runs before the credit check and fails     |
| `@readonly` on a test that writes | the label lies, and the next reader trusts it |
