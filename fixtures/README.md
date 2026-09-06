# Fixtures

The root holds the vocabulary a spec writes with. Everything else is grouped by
what it is for.

```text
fixtures/
  test.ts            the test object every spec imports
  tags.ts            how a test declares its context — see docs/scenario-tags.md
  viewport.ts        a window wide enough for every column
  routes.ts          app URLs
  entity-types.ts    entity type names, and the listing slug for one
  data-types.ts      what each section of the Data page lists, in order

  run/               the run itself; setup/, scripts/ and api/ use these
    env.ts           environment, deployment, run id, workspace, workers
    auth.ts          signing a user in through Keycloak
    logger.ts
    credit-report.ts what the run did with credits

  steps/             things a spec does to a page
    campaign.ts      generating a scan config campaign and launching it
  checks/            shared assertions a spec reuses
  scan-config/       the scan-config editor: seeds, driver, wording
```

A spec never imports from `run/`: those files read the environment and the
filesystem, and belong to setup, teardown and the CI scripts.

A check that a single scenario needs stays in that scenario's folder. It moves
into `checks/` once a second scenario needs it, the same rule `locators/`
follows.
