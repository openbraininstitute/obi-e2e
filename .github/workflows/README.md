# Workflows

`e2e.yml` is the only workflow. It decides what to run from the trigger:

| Trigger                               | Target             | What runs     | Result                                |
| ------------------------------------- | ------------------ | ------------- | ------------------------------------- |
| Schedule, 07:00 UTC                   | staging            | full suite    | Teams card                            |
| Schedule, 07:00 UTC                   | production         | `@smoke` only | Teams card                            |
| Push / PR in this repo                | staging            | full suite    | PR check                              |
| `repository_dispatch` (`e2e-preview`) | the PR preview URL | full suite    | comment on the source PR + Teams card |
| Manual run                            | your choice        | your choice   | Teams card                            |

## Configuration

Repository **variables**: `E2E_BASE_URL_STAGING`, `E2E_BASE_URL_PRODUCTION`.

Repository **secrets** (same names as the Selenium repo, plus one):
`OBI_USERNAME`, `OBI_PASSWORD`, `LAB_ID_STAGING`, `LAB_ID_PRODUCTION`,
`MS_TEAMS_NEW_WEBHOOK_URI`, and `CORE_WEB_APP_PR_TOKEN` (a token that may
comment on `core-web-app` PRs).

There is no project secret: every run creates a project inside the lab, moves a
budget into it, and deletes it at the end.

Optional: `OBI_ONBOARDING_USERNAME` and `OBI_ONBOARDING_PASSWORD` for the second
user that tests virtual lab creation. Leave them unset and those tests skip.

## The `e2e` label bridge

`core-web-app` deploys every PR to a preview URL. Adding the `e2e` label to a PR
runs a small workflow there that waits for the preview, then dispatches to this
repo. Copy `pr-label-bridge.example.yml` into `core-web-app` to set it up.
Remove and re-add the label to run again.
