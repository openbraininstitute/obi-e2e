# Workflows

`e2e.yml` runs the tests. It decides what to run from the trigger:

| Trigger                         | Target      | What runs   | Result     |
| ------------------------------- | ----------- | ----------- | ---------- |
| Schedule, 07:00 UTC             | staging     | full suite  | Teams card |
| Push to `main`                  | staging     | full suite  | Teams card |
| `core-web-app-release` dispatch | staging     | full suite  | Teams card |
| Manual run                      | your choice | your choice | Teams card |

`core-web-app` fires the dispatch when it releases, with the tag in
`client_payload.release`. Both suites listen for it, and the tag seeds the
thread key so the release gets a thread of its own.

Pull requests are not tested for the time being: the suite runs against staging
and production only. The `pull_request` trigger and the `e2e-preview` dispatch
type the label bridge fires are both gone from `e2e.yml`; git history has them
when per-PR runs come back.

The scheduled run runs everything. A test only stays out of it by carrying
`@staging` or `@production`, and a workflow only by leaving that deployment out
of its fixture's `env` list. See
[docs/scenario-tags.md](../../docs/scenario-tags.md).

Production is not scheduled: it has no credentials yet. The tags, the `env`
lists and the `production` project all stay as they are, and a manual run can
still target it — see the note in `e2e.yml` to put it back on the schedule. It
is the only way to reach production: a manual run is the one trigger that
carries an input, and every other event falls through to staging.

Production runs are not read-only: they create a project in the production
lab, move credits into it, and delete it at the end, the same as staging.

## `e2e-slow.yml`

The campaigns that are followed to the end but take longer than the nightly
suite can hold — a microcircuit simulation, a mesh skeletonisation. They carry
`@slow`, `e2e.yml` leaves them out, and this job gives them six hours on the
clock instead of forty-five minutes. It starts with the nightly suite at 07:00
UTC and runs beside it, and can be dispatched by hand as well.

A case opts in with one word in its seed — `"slow": true` — and gets four hours
instead of five minutes. See
[docs/workflow-tests.md](../../docs/workflow-tests.md).

It publishes too, into `slow/` inside the same run folder as the regular suite,
and posts into the same Teams thread hours later.

## One Teams thread per run

The two suites are separate workflow runs that finish hours apart, and both
land under one parent message. The webhook never returns a message id, so
neither run can reply to anything; instead each computes the same **thread key**
in its first step — `<UTC date>-<event>-<seed>-<environment>`, the seed being
the release tag or the short sha — and the Power Automate flow keeps the
key-to-message-id map. The environment is in there because dispatching the
regular suite at production and the slow one at staging matches on everything
else, and the two would otherwise share a thread while testing two deployments.

`e2e.yml` announces the run as soon as it starts, which is what creates the
thread; `e2e-slow.yml` never announces and only posts its result. A slow run
dispatched on its own finds no thread and opens one.

The flow keeps the parent card it was sent first and re-renders that same copy
on every later call, changing nothing but the row of **Finished** badges — one
per suite, green or red. So the parent says what the run was according to
whoever opened the thread, and no suite that finishes later can rewrite it. The
flow that does this,
and the SharePoint list behind it, are set up in
[docs/teams-reporting.md](../../docs/teams-reporting.md).

## `perf.yml`

Lighthouse on the marketing pages, at 06:00 UTC on both deployments, or on the
deployment chosen for a manual run. It uploads the reports as an artifact and
posts its own Teams card through the same webhook. See
[perf/README.md](../../perf/README.md).

## `gh-pages`

Every scheduled, manual and `main` run folds its results into the `gh-pages`
branch: `runs/<date>-<HHhMM>-<environment>/summary.json` and that run's full
Playwright report, with the slow suite's beside it in the folder's `slow/`. The
stamp is UTC and a second run inside the same minute gets `-1`, `-2`. Every run
of the five newest days stays — a folder's day is its first ten characters — and
older days are deleted, runs and all. The branch is force-pushed as a single
commit, so five days of reports never grow the repository.

A folder per run rather than per day is what stops a push at 10:00 overwriting
the night's report. `runs.json` lists the full folder names, newest first, and
the page reads all three parts out of each name: the environment filters, the
date picks the day, and the time picks the version within it.

Both publish jobs take the repository-wide `gh-pages` concurrency group, so the
two workflows queue rather than force-push over each other. Neither can be
handed the folder name across workflows, so **both** look the folder up by the
thread key, written into it as `thread-key`: whichever publishes first opens the
folder and the other folds into it. Only one of them did that at first, and
since the slow suite usually gets there first — a campaign can fail in two
minutes while the regular suite is still half an hour from finishing — the two
halves of one run kept landing in two folders, leaving the day's newest run with
no Slow switch on it.

`history.json` is the exception the sweep leaves alone — a few hundred bytes per
run, 400 runs deep, so the dashboard's trend charts can look back further than
the reports do. It stays keyed by day, and only the regular suite writes it.

The page itself is [`gh-web/`](../../gh-web/README.md): a Vite and React bundle
with TanStack Charts, built by the `site` job and copied onto the branch by
`publish`. It has a day and version picker, an overview with four charts, and
tabs for endpoint status, features, failures and the embedded Playwright report.

`site` is a separate job on purpose. `publish` runs `if: always()`, so it is what
still reports a night the suite failed, which is the night people open the page.
A bundler error costs the new dashboard and nothing else: `publish` keeps serving
the bundle already on the branch and says so in a warning annotation.

Artifacts are kept for five days too, so the two agree.

Pages must be set to deploy from the `gh-pages` branch, root folder. The site is
public — the repository has to be public for Pages on this plan, and Pages
access control is Enterprise Cloud only.

## Configuration

Repository **variables**: `E2E_BASE_URL_STAGING`, `E2E_BASE_URL_PRODUCTION`,
`E2E_PROJECT_CREDITS` (optional; defaults to 2,000 in the test code) and
`E2E_SLOW_PROJECT_CREDITS` (optional; 500), which funds the slow workflow's own
project so either suite can be refunded without touching the other.

Repository **secrets** (same names as the Selenium repo, plus one):
`OBI_USERNAME`, `OBI_PASSWORD`, `LAB_ID_STAGING`, `LAB_ID_PRODUCTION`,
`MS_TEAMS_WEBHOOK_URI`, and `CORE_WEB_APP_PR_TOKEN` (a token that may
comment on `core-web-app` PRs).

There is no project secret: every run creates a project inside the lab, moves a
budget into it, and deletes it at the end. A step after the tests gives the
project back even when the job is cancelled.

Optional: `OBI_ONBOARDING_USERNAME` and `OBI_ONBOARDING_PASSWORD` for the second
user that tests virtual lab creation. Leave them unset and those tests skip.

## The `e2e` label bridge

Not wired up at the moment — `e2e.yml` listens for `core-web-app-release` and
for nothing else. `pr-label-bridge.example.yml` stays as the template:
`core-web-app` deploys every PR to a preview URL, and a small workflow there can
wait for the preview and dispatch to this repo when the `e2e` label is added.
Add the `e2e-preview` type to the `repository_dispatch` trigger, and restore the
`report-to-pr` job, before copying it over.
