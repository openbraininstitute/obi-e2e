# Seminar stress test

Plays N students running the three experiments of the UC3M handout
(sessions 8 and 9) at the same time, then writes a plain-English report.

One student = 7 simulations (Experiment 1: 2, Experiment 2: 4, Experiment 3: 1),
about 70 credits.

## Run it

```bash
bun run auth                          # the test user's session
aws sso login --profile staging       # for the AWS part (containers, machines, CloudWatch)
bun run stress --users 3 --dry-run    # validates the configs with OBI-ONE, spends nothing
bun run stress --users 5
bun run stress --users 50 --ramp 120  # 50 students arriving over 2 minutes
```

| Option            | Default | Meaning                                                    |
| ----------------- | ------- | ---------------------------------------------------------- |
| `--users`         | 5       | How many students                                          |
| `--ramp`          | 60      | Seconds over which they start (0 = all at the same second) |
| `--experiments`   | 1,2,3   | Which experiments each student runs                        |
| `--think`         | 0       | Seconds a student pauses between experiments               |
| `--env`           | staging | `staging` or `production`                                  |
| `--watch-minutes` | 60      | How long to wait for the simulations after the last launch |
| `--tail-minutes`  | 5       | How long to keep watching machines scale down afterwards   |
| `--dry-run`       |         | Only check the configs; no project, no credits             |
| `--no-aws`        |         | Skip the AWS part                                          |
| `--keep-project`  |         | Return the credits but keep the project                    |
| `--project`       |         | Use this existing project instead of a new one             |

The AWS CLI writes its login cache under `~/.aws`, so inside a sandbox the run
needs it turned off for the AWS part.

## What it does

Each student makes the calls the web app makes, straight to the backend, with no browser:
circuit lookup (entitycore) → populations, grid count, Generate (OBI-ONE) →
list simulations (entitycore) → price and launch each one (OBI-ONE).

While they run it watches:

- every simulation's status in entitycore, every 10 s, as the app does;
- OBI-ONE and entitycore health, every 15 s;
- on AWS: each simulation's container in `launch_system_executor`
  (created, image pulled, started, stopped, exit code), and the EC2 machine count.

At the end it reads CloudWatch for the run's window (CPU and memory of OBI-ONE,
entitycore, the launch system and their databases) and entitycore's request log.

A new project is not usable for launches for 5 minutes: the launch system
caches each user's projects for 300 s, so the run waits that out. `--project <id>`
skips the wait.

It works in a project of its own with just enough credits, and gives both back
once everything has settled. Ctrl+C stops new launches and still cleans up.

Output: `.e2e-runs/stress/<run>/results.json` (every call and timing) and
`report.md`. `bun stress/report.ts <results.json>` rewrites a report.

## What it does not test

- The web app's pages (no browser loads them).
- Fifty different accounts: every student is the same test user.
