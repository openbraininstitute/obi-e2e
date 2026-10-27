# What the suite costs entitycore

For [prod-platform-architecture#225](https://github.com/openbraininstitute/prod-platform-architecture/issues/225).
Measured on 27 Oct 2026 against `main.preview.openbraininstitute.org`, which
uses the staging backend, with the regular suite (`bun run test`) and
`E2E_REQUEST_LOG=1`. Numbers come from the browser: every response a test's
page received from `/api/<service>/…`, with its decoded body size and the time
from request to body end. Run it again the same way after an entitycore change
to see whether it helped:

```bash
E2E_REQUEST_LOG=1 bun run test && bun scripts/request-report.ts
```

The run: 08:48:27 to 09:34:03 UTC, 45.6 min, **8 workers** on a laptop
(CI's 2-core runner gives 2, so the nightly load is lower than this), 298 tests,
272 passed, 26 failed. Two other runs of mine overlapped it (an EM circuit
build chain, and a few timing calls with `curl`), so it is not a clean window.

CloudWatch was read afterwards for the same window (§1, "On the server").

## 1. What the tests do to entitycore

| Service              | Requests | MB decoded | p50 ms | p95 ms | 5xx |
| -------------------- | -------: | ---------: | -----: | -----: | --: |
| entitycore           |    5 238 |      1 061 |    375 |  1 671 |   0 |
| virtual-lab-manager  |    3 182 |        146 |    702 |  2 144 |   0 |
| thumbnail-generation |      817 |          0 |    236 |    459 |   0 |
| obi-one              |      193 |        175 |    432 | 31 505 |   0 |
| auth                 |      144 |          0 |    182 |    474 |   0 |

115 entitycore requests a minute for 45 minutes. 347 page visits sent them:
**15 requests and 3.1 MB per visit** on average. No 5xx reached the browser;
the 315 `307`s are asset downloads redirected to S3.

Where the bytes go (decoded; on the wire the atlas is gzipped about 7:1, e.g.
`brain-atlas/{BBP atlas}/regions` is 248 KB on the wire, 1.87 MB decoded):

| entitycore endpoint                       | Requests |  MB | p50 ms | p95 ms |
| ----------------------------------------- | -------: | --: | -----: | -----: |
| `brain-atlas/{id}/regions?page_size=1000` |      461 | 551 |    315 |    588 |
| `circuit` (listing)                       |      244 | 226 |    734 |  1 320 |
| `brain-region-hierarchy/{id}/hierarchy`   |      266 | 126 |    293 |    690 |
| `emodel`                                  |       37 |  39 |    494 |    734 |
| `memodel`                                 |       76 |  16 |    566 |  1 465 |
| `cell-morphology`                         |      312 |   8 |    867 |  4 895 |

The atlas alone (`regions` + `hierarchy`) is 727 requests and **64 % of every
byte** entitycore sent. It is fetched on 204 of the 347 visits, about twice per
visit, and nothing survives a reload: the app keeps it in React Query memory
and entitycore sends no `Cache-Control`.

Where the time goes (109 responses took over 3 s):

| entitycore endpoint                          | Requests | p50 ms | p95 ms | over 3 s |
| -------------------------------------------- | -------: | -----: | -----: | -------: |
| `cell-morphology` (listing, with facets)     |      312 |    867 |  4 895 |       40 |
| `ion-channel-recording` (listing)            |      269 |  1 089 |  4 075 |       30 |
| `electrical-cell-recording` (listing)        |      267 |    807 |  2 690 |       11 |
| `single-neuron-synaptome`                    |       32 |    400 |  5 812 |        4 |
| `cell-composition/{id}/assets/{id}/download` |       15 |    782 |  8 556 |        3 |

Direct calls with `curl` during the run, one at a time:
`cell-morphology?page_size=30&with_facets=true` 4.7 s for 47 KB,
`page_size=0&with_facets=true` 4.4 s for 31 KB (the facets, not the rows,
are the cost); three `brain-region-hierarchy/{id}/hierarchy` answers of 238
bytes took 8.6 s, 11.3 s and 21.5 s. Latency, not payload.

Which pages and tests send the most:

| Page                                          | Visits | Per visit                                                                           |
| --------------------------------------------- | -----: | ----------------------------------------------------------------------------------- |
| `/data` (the Data page)                       |     20 | 36 requests, 4.8 MB: 4 × regions, 3 × hierarchy, 4 × mtype, one count per data type |
| `/data/browse/entity/circuit`                 |      9 | 27 requests, 19.8 MB: **13 × `/circuit`** per visit                                 |
| `/data/browse/entity/microcircuit-simulation` |      7 | 45 requests, 6.0 MB                                                                 |
| `/data/browse/entity/emodel`                  |      9 | 16 requests, 7.1 MB                                                                 |
| any other listing                             |   8–17 | 15–27 requests, 3.2–5.0 MB, of which 3.3 MB is the atlas                            |

| Spec file                                              | Requests |  MB |
| ------------------------------------------------------ | -------: | --: |
| `data/circuit/browse/browse.spec.ts`                   |      185 | 139 |
| `data/species-and-regions/species-and-regions.spec.ts` |      592 |  71 |
| `data/emodel/browse/browse.spec.ts`                    |      118 |  52 |
| `data/circuit/view/view.spec.ts`                       |       55 |  39 |
| `data/microcircuit-simulation/browse/browse.spec.ts`   |      220 |  32 |

Single test with the most requests: "Every species can be chosen" (140). With
the most bytes: "Every Synaptome filter narrows the listing" (16 MB).

What the load did to the run: 17 of the 26 failures were a listing, the Data
page or the atlas not arriving within 30 s (atlas counter, data-type tabs,
circuit listing, species selector), the pattern already noted as "staging
degrades under repeated suites". Of the rest, 3 are fixed on `release`
(obi-e2e#41, not on this branch), 5 were launches refused for lack of credits
after an EM skeletonization spent 900 of the project's 2 000 (that scenario
is switched off again), 1 was the recording array's variant card disabled
because the circuit-properties call failed under the same load.

### On the server (CloudWatch, staging account, 5-minute points)

entitycore is one Fargate task (1 vCPU, 4 GB) behind `private-alb`, on a
`db.t4g.medium` Postgres. Three windows, all UTC:

| Window             | What ran                                          | ALB requests | ECS CPU avg / max | ECS memory | RDS CPU avg / max | RDS connections | ALB target p95 | 5xx |
| ------------------ | ------------------------------------------------- | -----------: | ----------------: | ---------: | ----------------: | --------------: | -------------: | --: |
| 26 Oct 12:15–12:35 | nightly staging + preview CI runs, 2 workers each |       12 400 |          21 % / — |          — |          35 % / — |               — |         0.78 s |   0 |
| 27 Oct 07:45–08:05 | CI run on the preview (push), 2 workers           |       12 600 |       18 % / 63 % |  24 → 35 % |       36 % / 75 % |         19 → 30 |          0.9 s |   0 |
| 27 Oct 08:48–09:34 | this measurement, 8 workers, plus my EM chain     |       35 400 |       30 % / 97 % |  35 → 54 % |       56 % / 91 % |         37 → 40 |         0.94 s |   0 |

Before any run the task sits at 0.1 % CPU and the database at 4 %.

What this says:

- **The browser sees a sixth of the calls.** The ALB counted 35 400 requests
  to entitycore in my window against 5 238 logged in the browsers. The rest
  come from the app's server side, obi-one's tasks, thumbnail generation and
  the virtual lab manager, all triggered by the same page loads and launches.
  A nightly at 2 workers is about 12 500 requests in 20 minutes, 10 a second.
- **The database is the bottleneck, not the task.** RDS CPU peaked at 91 %
  (56 % over five minutes) while the task averaged 30 %; yesterday's nightly
  already took the database to 35 %. `db.t4g.medium` is a burstable class and
  its credit balance dipped (576 → 567). The facet queries above are where
  that CPU goes.
- **Task memory steps up and does not come back.** 24 % at rest, 35 % after
  the 2-worker CI run, 54 % (2.2 GB of 4) after mine, flat afterwards. Each
  run leaves the process larger: this is the shape behind the OOM restarts in
  #225, and the atlas payloads (1.9 MB decoded, 727 times) are the likeliest
  weight.
- **Latency at the ALB is fine; the slow responses are inside the server.**
  Target p95 stayed under 1 s at the load balancer, while the browser saw
  4–6 s p95 on the facet listings. The difference is queueing in the single
  task: one worker process serving 8 browsers plus the server-side callers.
- 4xx at the target rose from a handful to 50–97 per five minutes during the
  run (the 307 asset redirects are not 4xx). Not broken down: **not checked**.

## 2. What should change in obi-e2e

1. **Cache the atlas per worker.** `regions` and `hierarchy` are static for a
   deployment. A `page.route` in the `page` fixture that answers them from
   memory after the worker's first fetch removes 727 requests and 676 MB per
   run, 64 % of the bytes, with no change to what the tests see. Reasoned, not
   measured.
2. **Fewer page loads of the same listing.** Every browse spec opens its
   listing in `beforeEach`, 4–5 times per file: 347 visits for 258 tests.
   Read-only tests on one listing (results, search, columns, pagination) can
   share one page in `serial` mode and reload only when a test changed it.
   Halving the listing visits saves about 1 000 requests and 300 MB.
3. **Workers.** CI already runs 2. Locally the ceiling is 8, and this run
   shows what 8 do: listing p95 of 4–6 s and 17 load failures. Keep local
   full runs at 4 or fewer against staging; verify a change with its own spec.
4. **Keep this measurement.** `E2E_REQUEST_LOG=1` costs one JSON line per
   response. Running it monthly, or on request in CI, is how #225 sees whether
   an entitycore change helped.

## 3. What should change in entitycore or core-web-app

| Where               | What                                                                                                                                                                                                 | Evidence                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| entitycore          | `Cache-Control` and `ETag` on `brain-atlas/{id}/regions` and `brain-region-hierarchy/{id}/hierarchy`: static per deployment, 1.9 MB decoded, served 727 times in one run                             | §1, bytes table                                   |
| core-web-app        | Fetch the atlas once per page load, not twice, and keep it across loads (persisted query cache)                                                                                                      | 4 × regions and 3 × hierarchy per Data page visit |
| core-web-app        | The circuit listing calls `/circuit` 13 times per visit (0.9 MB each)                                                                                                                                | 244 requests, 226 MB, 9 visits                    |
| entitycore          | `cell-morphology` listing with facets: 4.4 s even for `page_size=0`, so the facet aggregation is the cost; same shape on `ion-channel-recording` (p95 4.1 s) and `electrical-cell-recording` (2.7 s) | time table, direct calls                          |
| entitycore          | 238-byte `hierarchy` answers taking 8–21 s under load: the service or its database saturates before any payload is involved                                                                          | direct calls                                      |
| entitycore          | `single-neuron-synaptome` p95 5.8 s; `cell-composition …/download` p95 8.6 s (asset redirect)                                                                                                        | time table                                        |
| virtual-lab-manager | Second-largest caller: 3 182 requests, p95 2.1 s; not in the scope of #225 but it shares every page load                                                                                             | service table                                     |
| entitycore          | The task's memory grows by about 10 % of 4 GB per suite and never comes back: look for a per-process cache of the atlas, or move entitycore off a single 1 vCPU task                                 | ECS memory 24 → 35 → 54 %                         |
| infra               | `db.t4g.medium` runs at 56 % average and 91 % peak CPU under 8 workers, 35 % under the nightly; the facet queries need an index or a materialized count before a bigger instance                     | RDS CPU                                           |

Not measured: which 4xx the target returned, response sizes on the wire for
anything but the BBP atlas, the same run at 2 workers, and the split of the
ALB count between the browser, the app's server side, obi-one and the
thumbnail service.
