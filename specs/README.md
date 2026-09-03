# Scenarios

One file per feature. Plain English, Gherkin style. A scenario describes what a
**user** does and sees, never how the code works.

| Word  | Meaning            |
| ----- | ------------------ |
| Given | starting situation |
| When  | what the user does |
| Then  | what the user sees |
| And   | one more line      |

Rules:

- Quote the exact text shown on screen: `"Simulate"`.
- One scenario checks one thing. Keep it under 10 lines.
- Per important feature: 1–3 happy paths and 1–3 error paths.
- Tags: `@smoke` runs on production, `@readonly` creates nothing.

A `Then` line is an expected result. Only a product decision changes it — never a
failing run. See the healing rule in the repository README.
