# Workflows

`e2e.yml` runs the tests. It decides what to run from the trigger:

| Trigger             | Target      | What runs   | Result     |
| ------------------- | ----------- | ----------- | ---------- |
| Schedule, 07:00 UTC | staging     | full suite  | Teams card |
| Push to `main`      | staging     | full suite  | Teams card |
| Manual run          | your choice | your choice | Teams card |

Pull requests are not tested for the time being: the suite runs against staging
and production only. The `pull_request` trigger and the `repository_dispatch`
(`e2e-preview`) arm the label bridge fires are both gone from `e2e.yml`; git
history has them when per-PR runs come back.

The scheduled run runs everything. A test only stays out of it by carrying
`@staging` or `@production`, and a workflow only by leaving that deployment out
of its fixture's `env` list. See
[docs/scenario-tags.md](../../docs/scenario-tags.md).

Production is not scheduled: it has no credentials yet. The tags, the `env`
lists and the `production` project all stay as they are, and a manual run can
still target it — see the note in `e2e.yml` to put it back on the schedule.

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

## `perf.yml`

Lighthouse on the marketing pages, at 06:00 UTC on both deployments, or on the
deployment chosen for a manual run. It uploads the reports as an artifact and
posts its own Teams card through the same webhook. See
[perf/README.md](../../perf/README.md).

## `gh-pages`

Every scheduled, manual and `main` run folds its results into the `gh-pages`
branch: `runs/<date>/summary.json` and that day's full Playwright report. The
five newest days stay and the rest are deleted, and the branch is force-pushed
as a single commit, so five days of reports never grow the repository.

`history.json` is the exception the sweep leaves alone — a few hundred bytes per
run, 400 runs deep, so the dashboard's trend charts can look back further than
the reports do.

The page itself is [`gh-web/`](../../gh-web/README.md): a Vite and React bundle
with TanStack Charts, built by the `site` job and copied onto the branch by
`publish`. It has a day picker, an overview with four charts, and tabs for
endpoint status, features, failures and the embedded Playwright report.

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
`E2E_PROJECT_CREDITS` (optional; defaults to 6,000 in the test code).

Repository **secrets** (same names as the Selenium repo, plus one):
`OBI_USERNAME`, `OBI_PASSWORD`, `LAB_ID_STAGING`, `LAB_ID_PRODUCTION`,
`MS_TEAMS_NEW_WEBHOOK_URI`, and `CORE_WEB_APP_PR_TOKEN` (a token that may
comment on `core-web-app` PRs).

There is no project secret: every run creates a project inside the lab, moves a
budget into it, and deletes it at the end. A step after the tests gives the
project back even when the job is cancelled.

Optional: `OBI_ONBOARDING_USERNAME` and `OBI_ONBOARDING_PASSWORD` for the second
user that tests virtual lab creation. Leave them unset and those tests skip.

## The `e2e` label bridge

Not wired up at the moment — `e2e.yml` no longer listens for the dispatch.
`pr-label-bridge.example.yml` stays as the template: `core-web-app` deploys
every PR to a preview URL, and a small workflow there can wait for the preview
and dispatch to this repo when the `e2e` label is added. Restore the
`repository_dispatch` trigger and the `report-to-pr` job before copying it
over.
