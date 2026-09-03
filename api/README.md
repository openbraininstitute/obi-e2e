# API helpers

HTTP helpers for checking the backend and for arranging test data without
driving the browser.

## Results, not exceptions

Every call returns a `Result` from [better-result](https://better-result.dev),
so a caller has to deal with failure before it can reach the value. Nothing in
`http.ts` throws.

```ts
const response = await requestJson<Lab[]>(url);
if (Result.isError(response)) {
  // response.error is NetworkError | HttpError | ParseError
}
```

The three failures are kept apart on purpose. A service that never answered, a
service that answered with an error, and a service that answered with something
unexpected are three different problems with three different fixes.
`describe(error)` turns any of them into one line for a failure message.

`virtual-lab.ts` is the exception that proves the rule: it throws, because its
callers are setup and teardown, where a failure should stop the run loudly
rather than be handled.

## Health checks

`setup/health.setup.ts` runs before every other project and checks each service
in `services.ts`. A service that is down then produces one clear failure instead
of a suite full of tests failing for reasons that are not the application.

Health answers are not uniform, so any 2xx counts:

| Service               | Health                         | Version    |
| --------------------- | ------------------------------ | ---------- |
| Entity core           | `/health`                      | `/version` |
| Virtual lab manager   | `/health`                      | none       |
| OBI One               | `/health`                      | `/version` |
| Circuit               | `/health`                      | `/version` |
| Notebook service      | `/health`                      | none       |
| Thumbnail generation  | `/health`                      | none       |
| Small scale simulator | `/health`                      | none       |
| AI agent              | `/healthz`                     | `/version` |
| Auth manager          | `/health` above its `/v1` base | none       |
| Launch system         | not checkable                  | none       |

The launch system is reachable only inside the VPC. From outside, its load
balancer redirects to the web application, which answers 200 with HTML. That is
not a health signal, so the check skips it and says so.

## Rules

- Use these to **arrange** state, never to assert what the user sees.
- On production, touch only the QA lab and project.
- Every helper that creates something offers the matching delete.
