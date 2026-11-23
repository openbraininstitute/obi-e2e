/**
 * Seminar stress test: N students run the handout's three experiments at once.
 *
 *   bun run stress --users 5                 # 5 students, all three experiments
 *   bun run stress --users 50 --ramp 120     # 50 students arriving over 2 minutes
 *   bun run stress --users 10 --experiments 1,2
 *   bun run stress --users 3 --dry-run       # validates the configs, spends nothing
 *
 * Each student does what the web app does when the handout is followed:
 * find the circuit, read its populations, count the grid, Generate (OBI-ONE),
 * list the campaign's simulations, price each one, and launch each one. No browser:
 * the backend sees the same calls, and one laptop can play fifty students.
 *
 * Meanwhile it watches: every simulation's status in entitycore, OBI-ONE and
 * entitycore health, and on AWS the launch system's containers and machines.
 * At the end it reads CloudWatch for the run's window and writes
 * `.e2e-runs/stress/<run>/results.json` and `report.md`.
 *
 * Before: `bun run auth` (the test user's session) and, for the AWS part,
 * `aws sso login --profile staging`.
 *
 * It works in a project of its own, created at the start with just enough
 * credits, and gives it back (credits, then the project) once every simulation
 * has settled. Ctrl+C stops launching, keeps watching what was launched, and
 * still gives the project back; a second Ctrl+C leaves at once and says what to
 * clean up.
 */

import { mkdirSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { AwsWatch } from './aws';
import { EXPERIMENTS, type ExperimentId } from './experiments';
import {
  normalise,
  renderReport,
  type Call,
  type LogError,
  type Phase,
  type Results,
  type Simulation,
  type Student,
} from './report';

// ---------------------------------------------------------------- options

const { values: opts } = parseArgs({
  options: {
    users: { type: 'string', default: '5' },
    ramp: { type: 'string', default: '60' },
    experiments: { type: 'string', default: '1,2,3' },
    think: { type: 'string', default: '0' },
    env: { type: 'string', default: 'staging' },
    'watch-minutes': { type: 'string', default: '60' },
    'tail-minutes': { type: 'string', default: '5' },
    'dry-run': { type: 'boolean', default: false },
    'no-aws': { type: 'boolean', default: false },
    'keep-project': { type: 'boolean', default: false },
    project: { type: 'string' },
    help: { type: 'boolean', default: false },
  },
});

if (opts.help) {
  console.log(
    await Bun.file(import.meta.path)
      .text()
      .then((t) => t.split('*/')[0])
  );
  process.exit(0);
}

const USERS = positive('users');
const RAMP_S = Number(opts.ramp);
const THINK_S = Number(opts.think);
const WATCH_MS = positive('watch-minutes') * 60_000;
const TAIL_MS = Number(opts['tail-minutes']) * 60_000;
const DRY = opts['dry-run'];
const ENV = opts.env;
const PICKED = opts.experiments.split(',').map(Number) as ExperimentId[];
if (PICKED.some((e) => !EXPERIMENTS[e]))
  throw new Error(`--experiments takes 1, 2 and/or 3, got ${opts.experiments}`);
if (ENV !== 'staging' && ENV !== 'production')
  throw new Error(`--env is staging or production, got ${ENV}`);

function positive(name: 'users' | 'watch-minutes'): number {
  const n = Number(opts[name]);
  if (!Number.isInteger(n) || n < 1)
    throw new Error(`--${name} must be a whole number above 0, got ${opts[name]}`);
  return n;
}

/*
 * Which app the session cookies belong to. Set before the repo's env module
 * loads its files, so a localhost E2E_BASE_URL in .env.local cannot win.
 * The token is the one `bun run auth` saved under the `live` run.
 */
process.env.E2E_ENV = ENV;
process.env.E2E_RUN_ID = 'live';
process.env.E2E_BASE_URL ??=
  ENV === 'production'
    ? 'https://www.openbraininstitute.org'
    : 'https://main.preview.openbraininstitute.org';

const { cellApiUrl, requireEnv } = await import('@fixtures/run/env');
const { accessToken } = await import('@fixtures/run/token');
const { VirtualLabApi } = await import('@api/virtual-lab');

const API = cellApiUrl();
const { LAB_ID } = requireEnv('LAB_ID');
const RUN_ID = `stress-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}-${USERS}u`;
const OUT = `.e2e-runs/stress/${RUN_ID}`;
mkdirSync(OUT, { recursive: true });

/** Credits per simulation (the handout: 20 for 2). The project gets this plus a margin. */
const CREDITS_PER_SIMULATION = 10;
const MARGIN = 1.5;
/** The launch system's AUTH_CACHE_MAX_TTL, plus a little. */
const LAUNCH_AUTH_CACHE_MS = 310_000;

/** As often as the app asks while a simulation runs (TASK_STATUS_POLL_INTERVAL_MS). */
const POLL_MS = 10_000;
const PROBE_MS = 15_000;
/**
 * Simulation ids per status call. The gateway in front of entitycore answers 403
 * to a URL over about 2 KB (50 ids, 2.5 KB, refused on staging 2026-11-17);
 * 20 ids is 1 KB.
 */
const STATUS_BATCH = 20;

// ---------------------------------------------------------------- clock

/**
 * This machine's clock can be off from the servers' (9 s behind on 2026-11-17),
 * and the report subtracts our times from AWS and entitycore times. So every
 * time we record is server time: the local clock plus an offset measured from
 * the services' Date headers when the run starts.
 */
let clockOffsetMs = 0;
const now = () => Date.now() + clockOffsetMs;

/** Median of five readings. A Date header has one-second steps, so ±0.5 s. */
async function measureClockOffset(): Promise<number> {
  const readings: number[] = [];
  for (let i = 0; i < 5; i++) {
    const sent = Date.now();
    const response = await fetch(`${API}/entitycore/health`).catch(() => undefined);
    const received = Date.now();
    const date = response?.headers.get('date');
    if (date) readings.push(Date.parse(date) + 500 - (sent + received) / 2);
  }
  readings.sort((a, b) => a - b);
  return Math.round(readings[Math.floor(readings.length / 2)] ?? 0);
}

// ---------------------------------------------------------------- state

const results: Results = {
  runId: RUN_ID,
  env: ENV,
  users: USERS,
  experiments: PICKED,
  rampSeconds: RAMP_S,
  startedAt: now(),
  endedAt: now(),
  calls: [],
  students: [],
  simulations: [],
  cloud: [],
  containers: [],
  machines: [],
  scaling: [],
  insights: [],
  notChecked: [],
  dryRun: DRY,
};

let stopping = false;
let interrupts = 0;
process.on('SIGINT', () => {
  interrupts += 1;
  if (interrupts === 1) {
    stopping = true;
    log(
      'Ctrl+C: no new launches. Watching what was launched, then giving the project back. Ctrl+C again to leave now.'
    );
    return;
  }
  log(`Leaving now. Clean up by hand: project ${results.projectId ?? '(none)'} in lab ${LAB_ID}.`);
  void save().finally(() => process.exit(130));
});

function log(message: string): void {
  const t = ((now() - results.startedAt) / 1000).toFixed(0).padStart(5);
  console.log(`[${t}s] ${message}`);
}

/** The results file is written after every poll, so a crash loses at most ten seconds. */
async function save(): Promise<void> {
  results.endedAt = now();
  await Bun.write(`${OUT}/results.json`, JSON.stringify(results, null, 1));
}

// ---------------------------------------------------------------- http

/**
 * The access token, asked of the app at most every five minutes. NextAuth
 * renews it behind /api/auth/session; a run lasts longer than its hour.
 */
let token: { value: string; at: number } | undefined;
async function bearer(): Promise<string> {
  if (!token || Date.now() - token.at > 5 * 60_000)
    token = { value: await accessToken('primary'), at: Date.now() };
  return token.value;
}

type Answer<T> =
  | { ok: true; value: T; ms: number }
  | { ok: false; status: number; error: string; ms: number };

/**
 * One call to the platform, timed and recorded. Never throws: a failure is data.
 * No retries: Generate and Launch are not idempotent, and a retried launch is a
 * second paid simulation. A student who sees an error clicks again, which the
 * report counts as what it is, a failure.
 */
async function call<T>(
  phase: Phase,
  service: string,
  path: string,
  init: {
    method?: string;
    body?: unknown;
    project?: boolean;
    timeoutMs?: number;
    user?: number;
  } = {}
): Promise<Answer<T>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await bearer()}`,
    Accept: 'application/json',
    'virtual-lab-id': LAB_ID,
  };
  if (init.project !== false && results.projectId) headers['project-id'] = results.projectId;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  const at = now();
  const started = performance.now();
  const record = (status: number, ok: boolean, error?: string): number => {
    const ms = performance.now() - started;
    const entry: Call = { at, phase, service, ms, status, ok, path };
    if (init.user) entry.user = init.user;
    if (error) entry.error = error;
    results.calls.push(entry);
    return ms;
  };
  try {
    const response = await fetch(`${API}${path}`, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(init.timeoutMs ?? 120_000),
    });
    const text = await response.text();
    if (!response.ok) {
      const error = text.slice(0, 300) || response.statusText;
      return {
        ok: false,
        status: response.status,
        error,
        ms: record(response.status, false, error),
      };
    }
    const value = (text ? JSON.parse(text) : undefined) as T;
    return { ok: true, value, ms: record(response.status, true) };
  } catch (cause) {
    const error = cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
    return { ok: false, status: 0, error, ms: record(0, false, error) };
  }
}

const sleep = (ms: number) => Bun.sleep(ms);

// ---------------------------------------------------------------- a student

type Circuit = { id: string; lifecycle_status?: string };

async function student(user: number): Promise<void> {
  const me: Student = { user, startedAt: now(), experiments: [] };
  const ask = <T>(
    phase: Phase,
    service: string,
    path: string,
    init: Parameters<typeof call>[3] = {}
  ) => call<T>(phase, service, path, { ...init, user });
  results.students.push(me);

  for (const [index, id] of PICKED.entries()) {
    if (stopping) return;
    if (index > 0 && THINK_S > 0) await sleep(THINK_S * 1000);
    const experiment = EXPERIMENTS[id];
    const step: Student['experiments'][number] = { experiment: id };
    me.experiments.push(step);
    const fail = (why: string, refused = 0) => {
      step.error = why;
      for (let i = 0; i < refused; i++) {
        results.simulations.push({
          user,
          experiment: id,
          outcome: 'refused',
          error: why,
          statuses: [],
        });
      }
    };

    // "Public tab → search → Use model": entitycore, then OBI-ONE for the populations.
    const found = await ask<{ data: Circuit[] }>(
      'generate',
      'entitycore',
      `/entitycore/circuit?name=${encodeURIComponent(experiment.circuit)}`
    );
    const circuit = found.ok ? found.value.data[0] : undefined;
    if (!circuit) {
      fail(
        found.ok
          ? `circuit ${experiment.circuit} not found`
          : `circuit lookup: ${found.status} ${found.error}`,
        experiment.simulations
      );
      continue;
    }
    const pops = await ask<{ populations: string[] }>(
      'generate',
      'obi-one',
      `/obi-one/declared/circuit/${circuit.id}/biophysical_populations`
    );
    const population = pops.ok ? pops.value.populations[0] : undefined;
    if (!population) {
      fail(
        pops.ok
          ? 'circuit has no biophysical population'
          : `populations: ${pops.status} ${pops.error}`,
        experiment.simulations
      );
      continue;
    }

    const body = {
      ...experiment.config(circuit.id, population),
      info: {
        type: 'Info',
        campaign_name: `Exp${id} ${experiment.name}, student ${user}`,
        campaign_description: `${RUN_ID} student ${user}`,
      },
    };

    // "Generate simulation(s)": the count first, as the app does, then the grid.
    const count = await ask<number>(
      'generate',
      'obi-one',
      '/obi-one/declared/scan_config/grid-scan-coordinate-count',
      { body }
    );
    if (!count.ok || count.value !== experiment.simulations) {
      fail(
        count.ok
          ? `grid has ${count.value} simulations, expected ${experiment.simulations}`
          : `count: ${count.status} ${count.error}`,
        experiment.simulations
      );
      continue;
    }
    if (DRY) continue;

    const generated = await ask<string>(
      'generate',
      'obi-one',
      '/obi-one/generated/circuit-simulation-scan-config-generate-grid',
      { body, timeoutMs: 300_000 }
    );
    step.generateMs = generated.ms;
    if (!generated.ok || !generated.value) {
      fail(
        generated.ok
          ? 'Generate returned no campaign'
          : `generate: ${generated.status} ${generated.error}`,
        experiment.simulations
      );
      continue;
    }
    const campaignId = generated.value;

    const listed = await ask<{ data: { id: string; name: string }[] }>(
      'generate',
      'entitycore',
      `/entitycore/simulation?simulation_campaign_id=${campaignId}&page=1&page_size=100`
    );
    const simulations = listed.ok ? listed.value.data : [];
    if (simulations.length !== experiment.simulations) {
      fail(
        listed.ok
          ? `campaign holds ${simulations.length} simulations, expected ${experiment.simulations}`
          : `list: ${listed.status} ${listed.error}`,
        experiment.simulations
      );
      continue;
    }

    // "Launch simulations (n)": the price dialog estimates all at once, then one launch each.
    const launchStarted = performance.now();
    await Promise.all(
      simulations.map((s) =>
        ask('estimate', 'obi-one', '/obi-one/declared/task/estimate', {
          body: { task_type: 'circuit_simulation', config_id: s.id },
        })
      )
    );
    for (const s of simulations) {
      const sim: Simulation = {
        user,
        experiment: id,
        campaignId,
        simulationId: s.id,
        outcome: 'refused',
        statuses: [],
      };
      results.simulations.push(sim);
      if (stopping) {
        sim.error = 'not launched: the run was stopped';
        continue;
      }
      const launched = await ask<{ activity_id: string; job_id: string }>(
        'launch',
        'obi-one',
        '/obi-one/declared/task/launch',
        { body: { task_type: 'circuit_simulation', config_id: s.id } }
      );
      if (!launched.ok) {
        sim.error = `launch: ${launched.status} ${launched.error}`;
        continue;
      }
      sim.launchedAt = now();
      sim.executionId = launched.value.activity_id;
      sim.jobId = launched.value.job_id;
      sim.outcome = 'timeout';
      sim.statuses.push({ status: 'pending', at: sim.launchedAt });
    }
    step.launchMs = performance.now() - launchStarted;
    const mine = results.simulations.filter((s) => s.campaignId === campaignId);
    const refused = mine.filter((s) => !s.launchedAt);
    log(
      `student ${user}: experiment ${id}: ${mine.length - refused.length} of ${mine.length} launched` +
        (refused[0] ? `, refused: ${refused[0].error?.slice(0, 120)}` : '')
    );
  }
}

// ---------------------------------------------------------------- watching

type Execution = {
  id: string;
  status: string;
  start_time?: string | null;
  end_time?: string | null;
  creation_date?: string;
  used?: { id: string }[];
};

const SETTLED = new Set(['done', 'error', 'cancelled']);
const inFlight = () => results.simulations.filter((s) => s.launchedAt && !s.endedAt);

/** One status poll for every launched simulation that has not settled. */
async function pollStatuses(): Promise<void> {
  const open = inFlight();
  for (let i = 0; i < open.length; i += STATUS_BATCH) {
    const batch = open.slice(i, i + STATUS_BATCH);
    // entitycore reads a list as the parameter repeated, one id each (as the app sends it).
    const query = new URLSearchParams({ page: '1', page_size: '100' });
    for (const s of batch) query.append('used__id__in', s.simulationId ?? '');
    const answer = await call<{ data: Execution[] }>(
      'poll',
      'entitycore',
      `/entitycore/simulation-execution?${query}`
    );
    if (!answer.ok) continue;
    const byId = new Map(answer.value.data.map((e) => [e.id, e]));
    for (const sim of batch) {
      const execution = sim.executionId ? byId.get(sim.executionId) : undefined;
      if (!execution) continue;
      const last = sim.statuses.at(-1)?.status;
      if (execution.status !== last) sim.statuses.push({ status: execution.status, at: now() });
      if (execution.status === 'running' && !sim.runningAt) {
        // Not start_time: entitycore sets it when the execution is created, still pending.
        sim.runningAt = now();
      }
      if (SETTLED.has(execution.status)) {
        sim.endedAt = execution.end_time ? Date.parse(execution.end_time) : now();
        sim.outcome = execution.status === 'done' ? 'done' : 'error';
        if (sim.outcome === 'error') sim.error = `simulation ended ${execution.status}`;
      }
    }
  }
}

/** Light health checks, so the report can say whether a service slowed as load grew. */
async function probe(): Promise<void> {
  await Promise.all([
    call('probe', 'obi-one', '/obi-one/health', { project: false, timeoutMs: 20_000 }),
    call('probe', 'entitycore', '/entitycore/health', { project: false, timeoutMs: 20_000 }),
  ]);
}

/** Runs `job` every `ms` until `until()` is true. One tick at a time, never overlapping. */
async function every(ms: number, until: () => boolean, job: () => Promise<void>): Promise<void> {
  while (!until()) {
    const started = Date.now();
    try {
      await job();
    } catch (cause) {
      log(`watcher error: ${String(cause)}`);
    }
    await sleep(Math.max(0, ms - (Date.now() - started)));
  }
}

// ---------------------------------------------------------------- AWS

async function startAws(): Promise<AwsWatch | undefined> {
  if (opts['no-aws']) {
    results.notChecked.push(
      'AWS (containers, machines, CloudWatch): the run was started with --no-aws.'
    );
    return undefined;
  }
  const watch = new AwsWatch(ENV, now);
  try {
    await watch.check();
    return watch;
  } catch (cause) {
    const why = String(cause).split('\n')[0];
    log(`AWS not watched: ${why}`);
    results.notChecked.push(
      `AWS (containers, machines, CloudWatch): ${why}. Run \`aws sso login --profile ${ENV}\` first.`
    );
    return undefined;
  }
}

/** For every failed simulation, what the launch system says about its job. */
async function diagnose(): Promise<void> {
  const failed = results.simulations.filter((s) => s.jobId && s.outcome !== 'done');
  // Eight at a time: enough to be quick, few enough not to add load of our own.
  for (let i = 0; i < failed.length; i += 8) {
    await Promise.all(
      failed.slice(i, i + 8).map(async (sim) => {
        const job = await call<{ status?: string; error_reason?: string }>(
          'diagnose',
          'obi-one',
          `/obi-one/declared/task/${sim.jobId}`
        );
        if (job.ok)
          sim.job = { status: job.value.status, reason: job.value.error_reason ?? undefined };
      })
    );
  }
}

/** The launch system and OBI-ONE log groups, by the name the report uses. */
const LOG_GROUPS: Record<string, string> = {
  'OBI-ONE': 'obi_one_v2',
  'launch system orchestrator': 'launch_system_orchestrator2025112013245385150000000e',
  'launch system API': 'launch_system_api2025112013245372500000000d',
  entitycore: 'entitycore20250623132916923400000001',
};

/** A line logged at error level, or one that says a job failed. DEBUG lines that merely contain "error_reason" are not. */
const isErrorLine = (line: string) =>
  !/\| (DEBUG|INFO) |"level":"(DEBUG|INFO)"|^(DEBUG|INFO):/.test(line) &&
  /ERROR|failed to start|Exception|Error:/.test(line);

/** Lines that say an error follows, not what it is. */
const NOISE = /^(Traceback \(most recent call last\):|ERROR: Exception in ASGI application)$/;

async function readLogs(watch: AwsWatch, from: number, to: number): Promise<void> {
  // Each failed job's own lines in the orchestrator log: the reason it gave up.
  const failed = results.simulations.filter((s) => s.jobId && s.outcome !== 'done').slice(0, 20);
  for (const sim of failed) {
    const lines = await watch
      .logLines(LOG_GROUPS['launch system orchestrator']!, `"${sim.jobId}"`, from - 60_000, to)
      .catch(() => []);
    const telling = lines.filter(isErrorLine);
    if (telling.length > 0) sim.job = { ...sim.job, log: telling };
  }
  // Every error line in the services' logs during the run, identical ones counted together.
  const errors = new Map<string, LogError>();
  for (const [service, group] of Object.entries(LOG_GROUPS)) {
    const rows = await watch
      .insights(
        group,
        `fields @timestamp, @message | filter @message like /ERROR|Traceback|Exception|failed to start/ | sort @timestamp asc | limit 500`,
        from,
        to
      )
      .catch(() => []);
    for (const row of rows) {
      const message = normalise(String(row['@message'] ?? ''));
      if (!isErrorLine(message) || NOISE.test(message)) continue;
      const key = `${service}|${message}`;
      const at = Date.parse(String(row['@timestamp']).replace(' ', 'T') + 'Z');
      const seen = errors.get(key);
      if (seen) seen.count += 1;
      else errors.set(key, { service, message, count: 1, first: at });
    }
  }
  results.logErrors = [...errors.values()].toSorted((a, b) => b.count - a.count);
}

async function readCloud(watch: AwsWatch, from: number, to: number): Promise<void> {
  await readLogs(watch, from, to);
  // The containers this run caused: their JobId tag is the job id OBI-ONE's launch answered.
  const jobs = new Set(results.simulations.flatMap((s) => (s.jobId ? [s.jobId] : [])));
  await watch.sample();
  results.containers = [...watch.containers.values()].filter((c) => c.jobId && jobs.has(c.jobId));
  results.machines = watch.machines;
  results.scaling = await watch.scalingActivities(from - 60_000);

  // Exact container times beat a ten-second poll: use them where we have them.
  const byJob = new Map(results.containers.map((c) => [c.jobId, c]));
  for (const sim of results.simulations) {
    const container = sim.jobId ? byJob.get(sim.jobId) : undefined;
    if (!container) continue;
    sim.container = container.taskArn;
    // The container's own start beats a ten-second poll.
    if (container.startedAt) sim.runningAt = container.startedAt;
  }

  const metrics: [string, string, string, Record<string, string>, string][] = [
    [
      'OBI-ONE CPU',
      'AWS/ECS',
      'CPUUtilization',
      { ClusterName: 'obi_one_v2_ecs_cluster', ServiceName: 'obi_one_v2_service' },
      '%',
    ],
    [
      'OBI-ONE memory',
      'AWS/ECS',
      'MemoryUtilization',
      { ClusterName: 'obi_one_v2_ecs_cluster', ServiceName: 'obi_one_v2_service' },
      '%',
    ],
    [
      'entitycore CPU',
      'AWS/ECS',
      'CPUUtilization',
      { ClusterName: 'entitycore_ecs_cluster', ServiceName: 'entitycore_ecs_service' },
      '%',
    ],
    [
      'entitycore memory',
      'AWS/ECS',
      'MemoryUtilization',
      { ClusterName: 'entitycore_ecs_cluster', ServiceName: 'entitycore_ecs_service' },
      '%',
    ],
    [
      'entitycore database CPU',
      'AWS/RDS',
      'CPUUtilization',
      { DBInstanceIdentifier: 'entitycore' },
      '%',
    ],
    [
      'entitycore database connections',
      'AWS/RDS',
      'DatabaseConnections',
      { DBInstanceIdentifier: 'entitycore' },
      ' open',
    ],
    [
      'launch system API CPU',
      'AWS/ECS',
      'CPUUtilization',
      { ClusterName: 'launch_system_api', ServiceName: 'launch_system_api' },
      '%',
    ],
    [
      'launch system orchestrator CPU',
      'AWS/ECS',
      'CPUUtilization',
      { ClusterName: 'launch_system_orchestrator', ServiceName: 'launch_system_orchestrator' },
      '%',
    ],
    [
      'launch system database CPU',
      'AWS/RDS',
      'CPUUtilization',
      { DBInstanceIdentifier: 'launch-system' },
      '%',
    ],
    [
      'accounting database CPU',
      'AWS/RDS',
      'CPUUtilization',
      { DBInstanceIdentifier: 'accounting' },
      '%',
    ],
  ];
  for (const [label, namespace, name, dims, unit] of metrics) {
    try {
      const m = await watch.metric(namespace, name, dims, from, to);
      if (m) results.cloud.push({ label, unit, ...m });
      else results.notChecked.push(`${label}: CloudWatch had no data points for the run.`);
    } catch (cause) {
      results.notChecked.push(`${label}: ${String(cause).split('\n')[0]}`);
    }
  }

  // entitycore's own view of the load: per route, how many, how slow, how many 5xx.
  try {
    results.insights = await watch.insights(
      'entitycore20250623132916923400000001',
      `filter message = "request_completed"
       | stats count(*) as calls, sum(extra.status_code >= 500) as errors,
               pct(extra.process_time_ms, 50) as p50, pct(extra.process_time_ms, 95) as p95
         by extra.method as method, extra.route_template as route
       | sort calls desc | limit 15`,
      from,
      to
    );
  } catch (cause) {
    results.notChecked.push(`entitycore request log: ${String(cause).split('\n')[0]}`);
  }
}

// ---------------------------------------------------------------- the run

async function setUpProject(): Promise<void> {
  const lab = new VirtualLabApi(await bearer());
  const needed = Math.ceil(
    USERS *
      PICKED.reduce((n, e) => n + EXPERIMENTS[e].simulations, 0) *
      CREDITS_PER_SIMULATION *
      MARGIN
  );
  const balance = await lab.labBalance(LAB_ID);
  if (balance < needed) {
    throw new Error(
      `The lab holds ${balance} credits; ${USERS} students need about ${needed}. Top the lab up or use fewer --users.`
    );
  }
  if (opts.project) {
    results.projectId = opts.project;
    await lab.assignBudget(LAB_ID, results.projectId, needed);
    log(`using project ${results.projectId}, added ${needed} credits (lab had ${balance})`);
    return;
  }
  results.projectId = await lab.createProject(
    LAB_ID,
    RUN_ID,
    `Seminar stress test, ${USERS} students`
  );
  await save();
  await lab.assignBudget(LAB_ID, results.projectId, needed);
  log(`project ${results.projectId} created with ${needed} credits (lab had ${balance})`);

  /*
   * The launch system caches who may use which project for 300 s
   * (AUTH_CACHE_MAX_TTL), keyed by the token alone when OBI-ONE calls it, so a
   * project newer than that cache is refused: "User is not authorized for
   * project". Seen on staging 2026-11-17. Waiting it out is the only fix from
   * outside; --project skips it.
   */
  log('waiting 5 min so the launch system sees the new project (its access cache lasts 300 s)');
  await sleep(LAUNCH_AUTH_CACHE_MS);
}

async function giveBack(): Promise<void> {
  if (!results.projectId) return;
  if (inFlight().length > 0) {
    results.notChecked.push(
      `Project ${results.projectId} kept: ${inFlight().length} simulations had not settled. Delete it by hand later.`
    );
    log(`project kept: ${inFlight().length} simulations still running`);
    return;
  }
  const fresh = new VirtualLabApi(await bearer());
  try {
    const { balance } = await fresh.projectBalance(LAB_ID, results.projectId);
    if (balance > 0)
      await fresh.reverseBudget(LAB_ID, results.projectId, Math.floor(balance * 100) / 100);
    if (opts['keep-project'] || opts.project) {
      log(`credits returned; project ${results.projectId} kept`);
      return;
    }
    await fresh.deleteProject(LAB_ID, results.projectId);
    log('credits returned and project deleted');
  } catch (cause) {
    results.notChecked.push(
      `Giving the project back failed (${String(cause)}). Clean up ${results.projectId} by hand.`
    );
  }
}

async function main(): Promise<void> {
  const total = USERS * PICKED.reduce((n, e) => n + EXPERIMENTS[e].simulations, 0);
  log(
    `${RUN_ID}: ${USERS} students × experiments ${PICKED.join(',')} = ${total} simulations on ${ENV} (${API})${DRY ? ', dry run' : ''}`
  );

  const aws = DRY ? undefined : await startAws();
  if (!DRY) await setUpProject();
  clockOffsetMs = await measureClockOffset();
  results.clockOffsetMs = clockOffsetMs;
  if (Math.abs(clockOffsetMs) > 1000)
    log(
      `this machine's clock is ${(clockOffsetMs / 1000).toFixed(1)} s off the servers'; times are corrected`
    );
  // The clock starts when the students do, not during setup.
  results.startedAt = now();
  if (DRY)
    results.notChecked.push(
      'Dry run: configs were validated by OBI-ONE, nothing was generated or launched.'
    );

  let watchDone = false;
  const watchers = [
    every(PROBE_MS, () => watchDone, probe),
    every(
      POLL_MS,
      () => watchDone,
      async () => {
        await pollStatuses();
        await save();
      }
    ),
    aws
      ? every(
          PROBE_MS,
          () => watchDone,
          () => aws.sample()
        )
      : Promise.resolve(),
  ];

  // Students arrive spread over the ramp, as a room does when told "start now".
  const gap = USERS > 1 ? (RAMP_S * 1000) / (USERS - 1) : 0;
  await Promise.all(
    Array.from({ length: USERS }, (_, i) =>
      sleep(i * gap).then(() => (stopping ? undefined : student(i + 1)))
    )
  );
  const launched = results.simulations.filter((s) => s.launchedAt).length;
  log(`every student is through: ${launched} simulations launched, watching them now`);

  const deadline = Date.now() + WATCH_MS;
  const leaving = () => interrupts >= 2;
  while (inFlight().length > 0 && Date.now() < deadline && !leaving()) {
    await sleep(POLL_MS);
    const open = inFlight();
    const running = open.filter((s) => s.runningAt).length;
    log(
      `${open.length} not finished (${running} running, ${open.length - running} waiting for a machine)`
    );
  }
  const lastEnd = now();

  // Machines leave after the work does: keep watching them for a while.
  if (aws && TAIL_MS > 0 && launched > 0) {
    log(`all settled; watching machines scale down for ${TAIL_MS / 60_000} min`);
    await sleep(TAIL_MS);
  }
  watchDone = true;
  await Promise.all(watchers);

  if (inFlight().length > 0) {
    results.notChecked.push(
      `${inFlight().length} simulations had not finished after ${WATCH_MS / 60_000} min of watching.`
    );
  }
  await diagnose();
  if (aws) await readCloud(aws, results.startedAt, Math.max(lastEnd, now()));
  if (!DRY) await giveBack();

  results.notChecked.push(
    'The web app itself: no browser loaded its pages, so page loads (about 3 MB of atlas each) and the Next.js server are not part of this load.',
    'Fifty different accounts: every student here is the same test user, so per-user limits and fifty sign-ins are not tested.'
  );
  await save();
  await Bun.write(`${OUT}/report.md`, renderReport(results));
  log(`report: ${OUT}/report.md`);
}

await main();
