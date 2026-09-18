# The published dashboard

The page at the Pages URL. Vite, React and [TanStack Charts][charts], with the
motion components vendored from the [beUI][beui] registry.

```bash
bun run site:fixtures   # fake runs to develop against
bun run site            # dev server on :5173
bun run site:build      # bundle into gh-web/dist
bun run site:check      # tsc over gh-web
```

`bun run check` runs `site:check`, so the dashboard is typechecked on every pull
request alongside the tests.

## What it reads

These sit next to the bundle on the `gh-pages` branch, written by the `publish`
job in `e2e.yml` and, for the slow report, the one in `e2e-slow.yml`:

| File                         | Written by                  | Lifetime                   |
| ---------------------------- | --------------------------- | -------------------------- |
| `runs.json`                  | the publish job's day sweep | every run of five days     |
| `runs/<folder>/summary.json` | `summarize-results.ts`      | five days, with its report |
| `runs/<folder>/report/`      | the publish job             | five days                  |
| `runs/<folder>/slow/`        | the slow suite's publish    | five days                  |
| `history.json`               | `history.ts`                | 400 runs                   |

A folder is `<date>-<HHhMM>-<environment>` in UTC —
`runs/2026-09-18-07h04-staging/` — so the same day holds one folder per run and
a lexical sort still puts the newest first. The environment is in the name so
the deployment picker can filter runs without opening every summary to find out
which deployment each one tested. The sweep keeps every run belonging to the
five newest days, a day being a folder's first ten characters.

`runs/<folder>/slow/` holds the same `summary.json` and `report/` one level
down, and arrives hours after the rest of the folder. Both halves of a run are
read together, and the header offers a Regular/Slow switch only for the runs
whose slow half has landed — most runs have none, and a switch with nothing
behind it is worse than no switch.

Nothing on the page reads `history.json` any more; the trend charts that used it
are gone. The publish job still writes it, because it is the only file here that
cannot be rebuilt later. Deleting the writer would forfeit the record for good,
and it costs a few hundred bytes a run.

Each run carries a full Playwright report, so five days is all the branch can
hold without growing. `history.json` is the one file the day sweep does not
touch.

The report directory also carries the scenario of every failing test and a
`scenarios.json` index beside it.

## Picking a run

Two dropdowns. The day one lists the distinct dates in `runs.json`, and picking
one lands on that day's newest run. The version one lists the runs within that
day by time, and is hidden on a day that ran once — a dropdown with a single
option only asks a question it has already answered.

## Charts

Two, both about the run being looked at. Everything else the page shows is a
tile or a table.

**Outcomes** is a rounded donut of passed, failed, flaky and skipped, following
the catalog's [rounded donut][donut]. A donut needs `scales: { x: null, y: null }`
at the top level of `defineChart` and its tooltip in the second argument, not
inside the spec; the cartesian form of both is a type error.

**Credits** is one line cut into segments: what the run spent, and what was left
of what it was given. Two numbers on one axis is the thing a tile cannot show
and a second tile makes you subtract for.

There were four charts before, all trends across runs. They are gone. What
replaced them answers the question people actually open the page with, which is
what happened last night rather than what has happened over a month.

## The scenario drawer

Every failing test whose spec has a `scenario.md` gets a link in its card, and
the scenario opens in a drawer over the right half of the page, rendered with
[`@tanstack/markdown`][markdown].

The drawer is deliberately not modal: no backdrop and no scroll lock, so the
failures stay readable, scrollable and clickable beside it. That needed a `modal`
prop added to the vendored beUI drawer, which is the one local change to any
vendored file. It cannot be done from the outside, because the presence gate
sets `pointer-events: auto` as an inline style and no class can beat it.

`collect-scenarios.ts` already copied each failing test's scenario into the
report. It now also writes `scenarios.json` beside it, mapping spec to scenario,
because resolving "the nearest `scenario.md` at or above this spec" needs the
file system and the page only has HTTP.

## The vendored components

`src/components/motion/` and `src/lib/` come from the beUI registry, unmodified:

```bash
curl -s https://beui.dev/r/<slug>.json | jq -r '.files[] | .path'
```

They are excluded from oxlint in `.oxlintrc.json`. They are third-party source,
and editing them to satisfy our rules would make the next registry update a merge
rather than a copy. Everything under `src/` that we wrote is linted normally.

One exception: `drawer.tsx` carries a `modal` prop we added, marked in the file
as a local addition. Re-pulling that component from the registry drops it and
the scenario drawer becomes modal again.

`react/react-in-jsx-scope` is off repo-wide, which is simply correct for the
automatic JSX runtime this project uses.

## Themes

`index.html` sets the `dark` class from `prefers-color-scheme` in an inline
script before the stylesheet loads. Setting it from the bundle instead paints the
page light for a frame first. The verdict colours are CSS variables named after
the verdict rather than the colour, so both themes and the charts read the same
four tokens.

## The fixtures are kept away from the build

`bun run site:fixtures` writes into `gh-web/fixtures/`, which the dev server
serves at the same paths the published branch uses. The production build is
configured with no public directory at all. Served from `public/`, these would
land in `dist/`, and a fake `runs.json` on the published site would shadow the
real one.
[markdown]: https://tanstack.com/markdown
[donut]: https://tanstack.com/charts/catalog/charts/95-rounded-donut
