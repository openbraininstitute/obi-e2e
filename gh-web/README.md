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

Three files sit next to the bundle on the `gh-pages` branch, all written by the
`publish` job in `e2e.yml`:

| File                       | Written by                  | Lifetime                   |
| -------------------------- | --------------------------- | -------------------------- |
| `runs.json`                | the publish job's day sweep | the five newest days       |
| `runs/<date>/summary.json` | `summarize-results.ts`      | five days, with its report |
| `history.json`             | `history.ts`                | 400 runs                   |

The split is the whole point. Each day carries a full Playwright report, so five
days is all the branch can hold without growing. A trend chart wants far more
than five points, so the handful of numbers it needs are copied into
`history.json` instead, at a few hundred bytes a run. That file is the only thing
on the branch the day sweep does not touch.

A day that ran twice, a push after the nightly, keeps only the later row.

## Charts

Four, and each earns its place by answering something the tables cannot.

**Pass rate** scales its floor to the worst run on record rather than starting at
zero. A suite that sits at 97% is a flat line against a full axis, with every dip
flattened out of sight. The floor never climbs above 90%, so a genuinely bad
night still reads as a fall and not as a rescaled normal.

**Failures and flakes** plots only those two. Stacking them on top of the passes
was the first shape tried and it does not work: two hundred green against five
red is a solid green bar on every run, bad nights included.

**Duration** is wall clock for the whole suite. A climb here is usually the
application, not the tests.

**This run by feature** lies sideways. Feature names are long, and a vertical
band axis silently drops the labels it cannot fit — three of seven survived the
first attempt.

## The vendored components

`src/components/motion/` and `src/lib/` come from the beUI registry, unmodified:

```bash
curl -s https://beui.dev/r/<slug>.json | jq -r '.files[] | .path'
```

They are excluded from oxlint in `.oxlintrc.json`. They are third-party source,
and editing them to satisfy our rules would make the next registry update a merge
rather than a copy. Everything under `src/` that we wrote is linted normally.

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
