# Workflows

`e2e.yml` runs the tests. It decides what to run from the trigger:

| Trigger                               | Target             | What runs   | Result                                |
| ------------------------------------- | ------------------ | ----------- | ------------------------------------- |
| Schedule, 07:00 UTC                   | staging            | full suite  | Teams card                            |
| Push / PR in this repo                | staging            | full suite  | PR check                              |
| `repository_dispatch` (`e2e-preview`) | the PR preview URL | full suite  | comment on the source PR + Teams card |
| Manual run                            | your choice        | your choice | Teams card                            |

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
clock instead of forty-five minutes. It is manual for now, because no case has
needed the tag yet; give it a schedule when one does.

A case opts in with one word in its seed — `"slow": true` — and gets four hours
instead of five minutes. See
[docs/workflow-tests.md](../../docs/workflow-tests.md).

## `perf.yml`

Lighthouse on the marketing pages, at 06:00 UTC on both deployments, or on the
deployment chosen for a manual run. It uploads the reports as an artifact and
posts its own Teams card through the same webhook. See
[perf/README.md](../../perf/README.md).

## Configuration

Repository **variables**: `E2E_BASE_URL_STAGING`, `E2E_BASE_URL_PRODUCTION`.

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

`core-web-app` deploys every PR to a preview URL. Adding the `e2e` label to a PR
runs a small workflow there that waits for the preview, then dispatches to this
repo. Copy `pr-label-bridge.example.yml` into `core-web-app` to set it up.
Remove and re-add the label to run again.
