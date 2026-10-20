# Website performance

Lighthouse CI audits the marketing site every morning at 08:00 Zurich time: the home page and every
page it links to on the same host, outside `/app`. Each page runs three times
and the median counts. The result reaches the Teams channel as its own card,
separate from the test run.

This is lab data on Lighthouse's default mobile emulation with simulated
throttling. It catches a page getting slower between deploys. It does not say
what users experience: that is field data, and it belongs in the app itself.

## Running it

```bash
bun run perf                                  # staging, every page, three runs each
E2E_ENV=production bun run perf               # production
bun run perf --collect.numberOfRuns=1         # a quick look, one run per page
bun run notify --perf                         # post the card; prints it when MS_TEAMS_WEBHOOK_URI is unset
```

Run from the repository root. Lighthouse runs through `npx` on Node, not Bun,
so a laptop needs Node and Chrome; the version is pinned in `run.ts`. Reports
land in `perf/report/`, one HTML and one JSON per page, and the missed budgets
in `.lighthouseci/assertion-results.json`. Both are ignored by git.

Any flag after the base URL goes to `lhci autorun`, so anything from
[its configuration](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)
can be tried without editing the file.

## Budgets

`lighthouserc.json` holds them: LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms.
Those are Lighthouse's own "good" thresholds. Every budget is a `warn`: the
card shows what is over, and the job stays green. Once a page has been steady
under one for a few weeks, flip that budget to `error` and the job fails when
it is missed.

To audit as a desktop instead, add `"settings": { "preset": "desktop" }` under
`collect`.

## The card

One row per page: its Lighthouse score, the three metrics with the ones over
budget in red, and a status. The header says whether every page came in under
budget, and which deployment and Lighthouse version it was. Buttons open the
run, open the reports on GitHub Pages and download them.

It is posted the way the test run is: one thread per audit, announced when the
job starts and answered with the card and a `Lighthouse` badge when it ends. The
flow threads by a key, and a card sent without one is accepted and dropped, so
`TEAMS_THREAD_KEY` (`perf-<run id>-<environment>`) is always set. The HTML
reports are published to
`https://openbraininstitute.github.io/obi-e2e/perf/<date>-<environment>/`, with
the five newest days of each deployment kept.

## Pages

`run.ts` reads the links off the home page at run time, so a new marketing page
is covered the night it ships. Paths under `/app`, `/api` and `/_next` are left
out, as are links to other hosts and to files.
