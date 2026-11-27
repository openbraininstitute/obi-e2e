/**
 * Turns one stress run's results into a short report in plain English.
 *
 * Pure: results in, Markdown out, so `report.test.ts` can check it without a
 * network. `bun stress/report.ts <results.json>` rewrites the report of a past run.
 *
 * The report leads with what happened and why, then gives the evidence: every
 * failure with its ids and log line, then the numbers.
 */

import type { Container, MachineSample, ScalingActivity } from './aws';

export type Phase = 'generate' | 'estimate' | 'launch' | 'poll' | 'probe' | 'diagnose';

/** One HTTP call the script made. */
export type Call = {
  at: number;
  phase: Phase;
  service: string;
  ms: number;
  status: number;
  ok: boolean;
  error?: string;
  /** The request path, for the failure list. */
  path?: string;
  /** Which student made it, when a student did. */
  user?: number;
};

export type Outcome = 'done' | 'error' | 'timeout' | 'refused';

/** One simulation, from the student's click to its last status. */
export type Simulation = {
  user: number;
  experiment: 1 | 2 | 3;
  campaignId?: string;
  simulationId?: string;
  executionId?: string;
  /** The launch system's job; the ECS task running it carries it as its JobId tag. */
  jobId?: string;
  /** ARN of that ECS task, once matched. */
  container?: string;
  /** Epoch ms. */
  launchedAt?: number;
  /** When it started running: the container's start when AWS was watched. */
  runningAt?: number;
  /** When it settled. */
  endedAt?: number;
  outcome: Outcome;
  error?: string;
  /** Statuses in the order they were seen, with the time each one was first seen. */
  statuses: { status: string; at: number }[];
  /** For a failure: what the launch system says about the job, and its log lines. */
  job?: { status?: string; reason?: string; log?: string[] };
};

/** One student working through the experiments. */
export type Student = {
  user: number;
  startedAt: number;
  /** Per experiment: how long Generate took, then how long Launch took. */
  experiments: {
    experiment: 1 | 2 | 3;
    generateMs?: number;
    launchMs?: number;
    error?: string;
  }[];
};

/** A metric read from CloudWatch after the run, already summarised. */
export type CloudMetric = {
  label: string;
  unit: string;
  peak: number;
  average: number;
  before?: number;
};

/** Error lines from a service's log during the run, identical ones counted together. */
export type LogError = { service: string; message: string; count: number; first: number };

export type Results = {
  runId: string;
  env: string;
  users: number;
  experiments: (1 | 2 | 3)[];
  rampSeconds: number;
  startedAt: number;
  endedAt: number;
  projectId?: string;
  calls: Call[];
  students: Student[];
  simulations: Simulation[];
  cloud: CloudMetric[];
  /** The ECS tasks that ran this run's simulations. */
  containers: Container[];
  /** The executor's EC2 machine count, sampled through the run. */
  machines: MachineSample[];
  /** Machines added and removed during the run. */
  scaling: ScalingActivity[];
  /** entitycore's request log for the run, per route. */
  insights: Record<string, unknown>[];
  /** Error lines in the services' logs during the run. */
  logErrors?: LogError[];
  /** Server time minus this machine's time; recorded times are already corrected. */
  clockOffsetMs?: number;
  dryRun?: boolean;
  /** Things the run could not look at, and why. */
  notChecked: string[];
};

// ---------------------------------------------------------------- numbers

export function percentile(values: number[], p: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = values.toSorted((a, b) => a - b);
  const rank = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, rank)];
}

/** "850 ms", "4.2 s", "27 s", "2 min 5 s". Rounded once, so never "4 min 60 s". */
export function duration(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms)) return 'n/a';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)} s`;
  const s = Math.round(ms / 1000);
  if (s < 90) return `${s} s`;
  const m = Math.floor(s / 60);
  return s % 60 === 0 ? `${m} min` : `${m} min ${s % 60} s`;
}

/** "1 machine", "4 machines". */
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const typical = (values: number[]) => duration(percentile(values, 50));
const slowest = (values: number[]) => (values.length === 0 ? 'n/a' : duration(Math.max(...values)));

/** The most simulations in one state at once, sweeping start/end events. */
export function peakConcurrent(spans: { from: number; to: number }[]): {
  peak: number;
  at?: number;
} {
  const events = spans.flatMap((span) => [
    { at: span.from, delta: 1 },
    { at: span.to, delta: -1 },
  ]);
  // An end and a start at the same instant: count the end first.
  events.sort((a, b) => a.at - b.at || a.delta - b.delta);
  let now = 0;
  let peak = 0;
  let at: number | undefined;
  for (const event of events) {
    now += event.delta;
    if (now > peak) {
      peak = now;
      at = event.at;
    }
  }
  return { peak, at };
}

/** Busiest minute and the average per minute, of a list of event times. */
function perMinute(times: number[]): { peak: number; average: number } {
  if (times.length === 0) return { peak: 0, average: 0 };
  const buckets = new Map<number, number>();
  for (const t of times)
    buckets.set(Math.floor(t / 60_000), (buckets.get(Math.floor(t / 60_000)) ?? 0) + 1);
  const span = (Math.max(...times) - Math.min(...times)) / 60_000;
  return { peak: Math.max(...buckets.values()), average: times.length / Math.max(1, span) };
}

/** Ids, numbers and times out of a log line, so identical errors count together. */
export function normalise(line: string): string {
  return line
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>')
    .replace(/\b[0-9a-f]{32}\b/gi, '<id>')
    .replace(/\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d[.,\d]*(Z|[+-]\d\d:?\d\d)?/g, '<time>')
    .replace(/\b\d\d:\d\d:\d\d\b/g, '<time>')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------- what errors mean

/**
 * Errors we have seen and understood, in plain words. Data, not code: a new
 * one is one more entry. Matched against the error and its log lines.
 */
const KNOWN: { match: RegExp; means: string }[] = [
  {
    match: /list index out of range/,
    means:
      'The launch system asked AWS to start a container and got none back, and it does not handle that case: it reads the first container of an empty list and crashes (launch-system `orchestrator/utils/ecs.py`, `run_task_response["tasks"][0]`). It does not retry, and it drops the reason AWS gave.',
  },
  {
    match: /not authorized for project/i,
    means:
      "The launch system did not yet know this project. It keeps each user's project list for 5 minutes, and OBI-ONE does not tell it which project the call is for, so a brand-new project is refused until that list refreshes.",
  },
  {
    match: /Failed to submit task job/,
    means:
      'OBI-ONE could not hand the job to the launch system. The launch system\'s real answer is only in the OBI-ONE log, under "Errors in the service logs" below.',
  },
  {
    match: /\b502\b|Bad Gateway/,
    means:
      'The load balancer got no answer from the service behind it: the service was overloaded, restarting, or took too long.',
  },
  {
    match: /\b504\b|Gateway Time-out|TimeoutError|timed out/i,
    means: 'The service took too long to answer, so the call was given up.',
  },
  {
    match: /\b403\b.*<html>/s,
    means:
      'The gateway in front of the service refused the call before the service saw it (for example a URL that is too long).',
  },
  {
    match: /INSUFFICIENT_FUNDS|\b461\b/,
    means: 'The project ran out of credits.',
  },
];

function meaning(...texts: (string | undefined)[]): string | undefined {
  const all = texts.filter(Boolean).join('\n');
  return KNOWN.find((k) => k.match.test(all))?.means;
}

const REASONS: Record<string, string> = {
  start_failure: 'the launch system could not start it (no container was ever created)',
  executor_failure: 'it crashed while running',
  stop_failure: 'it ran, but could not be stopped cleanly',
  timeout: 'it ran past its time limit',
};

// ---------------------------------------------------------------- report

const NAMES = {
  1: 'Experiment 1 (Glutamate)',
  2: 'Experiment 2 (GABA)',
  3: 'Experiment 3 (Integration)',
};

/** A CPU or memory peak at or above this is called out. */
const HOT = 80;
/** Simulations per executor machine: 16 CPUs, 4 per simulation. */
const PER_MACHINE = 4;
/** Failures listed one by one; the rest are counted. */
const LISTED = 20;

const utc = (t: number | undefined) =>
  t === undefined ? 'n/a' : new Date(t).toISOString().slice(11, 19);

const between = (list: Simulation[], a: keyof Simulation, b: keyof Simulation) =>
  list.flatMap((s) => {
    const from = s[a] as number | undefined;
    const to = s[b] as number | undefined;
    return from && to && to >= from ? [to - from] : [];
  });

const took = (list: ScalingActivity[]) => list.flatMap((a) => (a.end ? [a.end - a.start] : []));

export function renderReport(results: Results): string {
  const { simulations: sims, calls, students, containers, machines, scaling } = results;
  const done = sims.filter((s) => s.outcome === 'done');
  const failed = sims.filter((s) => s.outcome !== 'done');
  const now = results.endedAt;
  const lines: string[] = [];
  const say = (...text: string[]) => {
    lines.push(...text);
  };

  // -------- the numbers everything below talks about
  const generate = students.flatMap((s) =>
    s.experiments.flatMap((x) => (x.generateMs ? [x.generateMs] : []))
  );
  const launch = students.flatMap((s) =>
    s.experiments.flatMap((x) => (x.launchMs ? [x.launchMs] : []))
  );
  const waits = between(sims, 'launchedAt', 'runningAt');
  const runs = between(done, 'runningAt', 'endedAt');
  const totals = between(done, 'launchedAt', 'endedAt');

  const launchedByJob = new Map(
    sims.flatMap((s) => (s.jobId && s.launchedAt ? [[s.jobId, s.launchedAt] as const] : []))
  );
  const span = (pick: (c: Container) => [number | undefined, number | undefined]) =>
    containers.flatMap((c) => {
      const [a, b] = pick(c);
      return a && b && b >= a ? [b - a] : [];
    });
  const queue = span((c) => [c.jobId ? launchedByJob.get(c.jobId) : undefined, c.createdAt]);
  const place = span((c) => [c.createdAt, c.startedAt]);
  const pulls = span((c) => [c.pullStartedAt, c.pullStoppedAt]);
  const created = perMinute(containers.flatMap((c) => (c.createdAt ? [c.createdAt] : [])));

  const running = peakConcurrent(
    sims.flatMap((s) => (s.runningAt ? [{ from: s.runningAt, to: s.endedAt ?? now }] : []))
  );
  const maxMachines = machines.length ? Math.max(...machines.map((m) => m.inService)) : 0;
  const slots = maxMachines * PER_MACHINE;
  const cloud = (label: string) => results.cloud.find((m) => m.label === label);
  const hot = results.cloud.filter((m) => m.unit === '%' && m.peak >= HOT);
  const orchestrator = cloud('launch system orchestrator CPU');
  const entitycoreCpu = cloud('entitycore CPU');
  const obiOneCpu = cloud('OBI-ONE CPU');

  // -------- title
  say(
    `# Stress test: ${results.users} students, ${results.experiments.map((e) => NAMES[e]).join(' + ')}, ${results.env}`,
    '',
    `${new Date(results.startedAt).toISOString().slice(0, 10)}, ${utc(results.startedAt)} to ${utc(results.endedAt)} UTC (${duration(results.endedAt - results.startedAt)}). ` +
      `${results.users} students ${results.rampSeconds === 0 ? 'all started in the same second' : `started over ${results.rampSeconds} s`}, ` +
      `each doing what the handout says: Generate, then Launch. ${sims.length} simulations in total, one test account` +
      (results.projectId ? `, project \`${results.projectId}\`.` : '.'),
    ''
  );

  if (results.dryRun) {
    const setup = calls.filter((c) => c.phase === 'generate');
    say(
      '## The short version',
      '',
      `- Dry run: OBI-ONE accepted ${setup.filter((c) => c.ok).length} of ${setup.length} setup calls. Nothing was generated or launched, no credits were spent.`,
      ''
    );
    renderNotChecked(results, say);
    return lines.join('\n');
  }

  // -------- the short version
  say('## The short version', '');
  if (sims.length === 0) {
    say(
      '- **Nothing was launched**, so this run says nothing about the simulations. See "What failed" below.'
    );
  } else if (failed.length === 0) {
    say(`- **All ${sims.length} simulations worked.**`);
  } else {
    const kinds = new Map<string, number>();
    for (const s of failed) {
      const why = s.job?.reason ? (REASONS[s.job.reason] ?? s.job.reason) : describeOutcome(s);
      kinds.set(why, (kinds.get(why) ?? 0) + 1);
    }
    say(
      `- **${done.length} of ${sims.length} simulations worked; ${failed.length} failed.** ` +
        [...kinds].map(([why, n]) => `${n} because ${why}`).join('; ') +
        '. Details, ids and log lines are under "What failed".'
    );
  }
  if (totals.length > 0) {
    say(
      `- **A student waited about ${typical(totals)} from Launch to result** (slowest ${slowest(totals)}). ` +
        `The simulation itself only runs about ${typical(runs)}; the rest is waiting to start.`
    );
  }

  // The biggest wait, and why.
  const stages = [
    { name: 'queue', ms: percentile(queue, 50) ?? 0 },
    { name: 'machine', ms: percentile(place, 50) ?? 0 },
  ];
  const biggest = stages.toSorted((a, b) => b.ms - a.ms)[0];
  if (biggest && biggest.ms > 10_000) {
    if (biggest.name === 'queue') {
      say(
        `- **The biggest wait is the launch system's own queue: ${typical(queue)} typical, ${slowest(queue)} at worst**, before AWS is even asked for a container. ` +
          `It created containers at about ${Math.round(created.average)} a minute (${created.peak} in its busiest minute)` +
          (orchestrator
            ? `, and its orchestrator, a single container, ran at ${orchestrator.peak.toFixed(0)}% CPU at peak and ${orchestrator.average.toFixed(0)}% on average`
            : '') +
          '. That one container is the bottleneck.'
      );
    } else {
      say(
        `- **The biggest wait is finding a machine: ${typical(place)} typical, ${slowest(place)} at worst.** New machines take minutes to come up (see "Machines").`
      );
    }
  }
  if (slots > 0 && running.peak > 0) {
    say(
      running.peak >= slots * 0.9
        ? `- **Machines were full**: ${count(running.peak, 'simulation')} ran at once, and ${count(maxMachines, 'machine')} hold about ${slots}.`
        : `- **Machines were not the limit**: at most ${count(running.peak, 'simulation')} ran at once, while ${count(maxMachines, 'machine')} had room for about ${slots}. A container found a machine in ${typical(place)} typically.`
    );
  }
  const slowClicks = [
    { what: 'Generate', values: generate },
    { what: 'Launch', values: launch },
  ].filter((x) => (percentile(x.values, 50) ?? 0) > 5_000);
  if (slowClicks.length > 0) {
    const waitingOn =
      obiOneCpu && obiOneCpu.peak < 60 && entitycoreCpu && entitycoreCpu.peak >= HOT
        ? ` OBI-ONE's own CPU stayed under ${Math.ceil(obiOneCpu.peak / 10) * 10}%, so it was waiting, most likely on entitycore, whose CPU reached ${entitycoreCpu.peak.toFixed(0)}%.`
        : '';
    say(
      `- **The buttons were slow**: ${slowClicks.map((x) => `${x.what} took ${typical(x.values)} (slowest ${slowest(x.values)})`).join(', ')}.${waitingOn}`
    );
  }
  const otherHot = hot.filter(
    (m) => m !== orchestrator && !(slowClicks.length && m === entitycoreCpu)
  );
  if (otherHot.length > 0) {
    say(
      `- **Also near its limit**: ${otherHot.map((m) => `${m.label} (${m.peak.toFixed(0)}% peak)`).join(', ')}.`
    );
  }
  const badCalls = calls.filter((c) => !c.ok && c.phase !== 'probe');
  if (badCalls.length === 0) say('- Every call the students made was answered.');
  say('');

  // -------- what a student sees
  say(
    '## What a student sees',
    '',
    '| Step | Typical | Slowest | What happens |',
    '|---|---:|---:|---|',
    `| Click **Generate** | ${typical(generate)} | ${slowest(generate)} | OBI-ONE builds the campaign and saves it in entitycore |`,
    `| Click **Launch** | ${typical(launch)} | ${slowest(launch)} | a price check, then one launch call per simulation |`,
    `| Wait to start | ${typical(waits)} | ${slowest(waits)} | the launch system queues the job, then AWS finds it a machine |`,
    `| Run | ${typical(runs)} | ${slowest(runs)} | the simulation runs in its own container |`,
    `| **Launch to result** | **${typical(totals)}** | **${slowest(totals)}** | |`,
    ''
  );
  if (results.experiments.length > 1) {
    for (const e of results.experiments) {
      const mine = sims.filter((s) => s.experiment === e);
      const t = between(
        mine.filter((s) => s.outcome === 'done'),
        'launchedAt',
        'endedAt'
      );
      say(
        `- ${NAMES[e]}: ${mine.filter((s) => s.outcome === 'done').length} of ${mine.length} worked, launch to result ${typical(t)} typical, ${slowest(t)} slowest.`
      );
    }
    say('');
  }

  // -------- where the wait went
  if (containers.length > 0 || machines.length > 0) {
    say('## Where the wait went', '');
    say(
      `1. **Launch system queue** (Launch → container created): ${typical(queue)} typical, ${slowest(queue)} slowest. ` +
        `The launch system created ${count(containers.length, 'container')} for ${count(sims.filter((s) => s.jobId).length, 'launched simulation')}, about ${Math.round(created.average)} a minute.`,
      `2. **Finding a machine** (container created → started): ${typical(place)} typical, ${slowest(place)} slowest.` +
        (pulls.length
          ? ` ${pulls.length} times the machine first had to download the simulation image, which took ${typical(pulls)}.`
          : ''),
      `3. **Running**: ${typical(runs)} typical, ${slowest(runs)} slowest.`,
      `4. **Shutting down**: ${typical(span((c) => [c.stoppingAt, c.stoppedAt]))} typical. ` +
        (containers.some((c) => c.stoppedAt && c.exitCode !== 0)
          ? `${containers.filter((c) => c.stoppedAt && c.exitCode !== 0).length} containers did not exit cleanly.`
          : 'Every container exited cleanly (exit code 0).'),
      ''
    );
    renderMachines(machines, scaling, say);
  }

  // -------- what failed
  renderFailures(results, say);

  // -------- services
  say('## How the services held up', '');
  if (results.cloud.length > 0) {
    say('| | Peak | Average | 10 min before |', '|---|---:|---:|---:|');
    for (const m of results.cloud) {
      const n = (v: number | undefined) =>
        v === undefined ? 'n/a' : `${v.toFixed(0)}${m.unit === '%' ? '%' : ''}`;
      say(
        `| ${m.label}${m.unit === '%' && m.peak >= HOT ? ' ⚠️' : ''} | ${n(m.peak)} | ${n(m.average)} | ${n(m.before)} |`
      );
    }
    say('');
  }
  const services = [
    ...new Set(calls.filter((c) => c.phase !== 'probe').map((c) => c.service)),
  ].toSorted();
  for (const service of services) {
    const mine = calls.filter((c) => c.service === service && c.phase !== 'probe');
    const bad = mine.filter((c) => !c.ok).length;
    say(
      `- Our calls to **${service}**: ${mine.length}, ${bad === 0 ? 'none failed' : `${bad} failed`}. Typical answer ${typical(mine.map((c) => c.ms))}, slowest ${slowest(mine.map((c) => c.ms))}.`
    );
  }
  say('');
  if (results.insights.length > 0) {
    say(
      "entitycore's own log for the run, busiest routes (everyone's calls, including OBI-ONE and the simulations themselves):",
      '',
      '| Route | Calls | Errors (5xx) | Typical | Slow (95%) |',
      '|---|---:|---:|---:|---:|'
    );
    for (const row of results.insights) {
      say(
        `| ${String(row.method)} ${String(row.route)} | ${String(row.calls)} | ${String(row.errors ?? 0)} | ${duration(Number(row.p50))} | ${duration(Number(row.p95))} |`
      );
    }
    say('');
  }

  renderNotChecked(results, say);
  return lines.join('\n');
}

function describeOutcome(s: Simulation): string {
  if (s.outcome === 'timeout') return 'it had not finished when we stopped watching';
  if (s.outcome === 'refused')
    return `it was never launched (${(s.error ?? 'no reason given').slice(0, 80)})`;
  return 'it ended in error';
}

function renderMachines(
  machines: MachineSample[],
  scaling: ScalingActivity[],
  say: (...t: string[]) => void
): void {
  if (machines.length === 0) return;
  const first = machines[0]!;
  const last = machines.at(-1)!;
  const peak = Math.max(...machines.map((m) => m.inService));
  const outs = scaling.filter((a) => a.what.startsWith('Launching'));
  const ins = scaling.filter((a) => a.what.startsWith('Terminating'));
  const parts = [
    `**Machines**: ${first.inService} when we started, ${peak} at most (16 CPUs each, about ${PER_MACHINE} simulations each), ${last.inService} when we stopped watching.`,
  ];
  if (outs.length > 0) {
    const up = took(outs);
    parts.push(
      `${outs.length} were added${up.length ? `, and each took about ${typical(up)} to be ready` : ''}${outs.some((a) => !a.end) ? ` (${outs.filter((a) => !a.end).length} still warming up at the end)` : ''}.`
    );
  } else {
    parts.push('None had to be added.');
  }
  parts.push(
    ins.length > 0
      ? `${ins.length} were removed afterwards, each in about ${typical(took(ins))}.`
      : 'None were removed while we watched: the pool shrinks back on its own later.'
  );
  const failedSteps = scaling.filter((a) => a.status === 'Failed');
  if (failedSteps.length > 0)
    parts.push(
      `${failedSteps.length} scaling steps failed: ${failedSteps
        .map((a) => a.what)
        .slice(0, 3)
        .join('; ')}.`
    );
  say(parts.join(' '), '');
}

function renderFailures(results: Results, say: (...t: string[]) => void): void {
  const failed = results.simulations.filter((s) => s.outcome !== 'done');
  const badCalls = results.calls.filter((c) => !c.ok && c.phase !== 'probe' && c.phase !== 'poll');
  const badPolls = results.calls.filter((c) => !c.ok && c.phase === 'poll');
  say('## What failed', '');
  if (failed.length === 0 && badCalls.length === 0 && badPolls.length === 0) {
    say('Nothing.', '');
  }

  for (const [i, s] of failed.slice(0, LISTED).entries()) {
    const why = s.job?.reason ? (REASONS[s.job.reason] ?? s.job.reason) : describeOutcome(s);
    say(`**${i + 1}. Student ${s.user}, ${NAMES[s.experiment]}: ${why}.**`, '');
    const log = s.job?.log ?? [];
    const means = meaning(s.error, ...log);
    if (means) say(`- Why: ${means}`);
    if (log.length > 0)
      say(
        `- Log: \`${log[0]!.slice(0, 300)}\`${log.length > 1 ? ` (+${log.length - 1} more lines in results.json)` : ''}`
      );
    else if (s.error) say(`- Error: \`${s.error.slice(0, 300)}\``);
    if (s.job?.status)
      say(`- Launch system: job status \`${s.job.status}\`, reason \`${s.job.reason ?? 'none'}\`.`);
    if (s.launchedAt)
      say(
        `- When: launched ${utc(s.launchedAt)}${s.endedAt ? `, failed ${utc(s.endedAt)}` : ''} UTC.`
      );
    const ids = [
      ['simulation', s.simulationId],
      ['campaign', s.campaignId],
      ['execution', s.executionId],
      ['job', s.jobId],
    ].filter(([, id]) => id);
    if (ids.length) say(`- Ids: ${ids.map(([k, id]) => `${k} \`${id}\``).join(', ')}.`);
    say('');
  }
  if (failed.length > LISTED) say(`…and ${failed.length - LISTED} more, all in results.json.`, '');

  // Calls that failed before a simulation existed (Generate, launch refusals), grouped.
  if (badCalls.length > 0) {
    say(`**Calls that failed** (${badCalls.length}):`, '');
    const groups = new Map<string, Call[]>();
    for (const c of badCalls) {
      const key = `${c.service} ${c.phase} → ${c.status || 'no answer'}: ${normalise((c.error ?? '').replace(/<[^>]+>/g, ' ')).slice(0, 160)}`;
      groups.set(key, [...(groups.get(key) ?? []), c]);
    }
    for (const [key, list] of groups) {
      const who = [...new Set(list.flatMap((c) => (c.user ? [c.user] : [])))];
      const means = meaning(list[0]!.error, String(list[0]!.status));
      say(
        `- ${list.length}× ${key}` +
          ` (${utc(list[0]!.at)}${list.length > 1 ? `–${utc(list.at(-1)!.at)}` : ''} UTC${who.length ? `, student${who.length > 1 ? 's' : ''} ${who.slice(0, 10).join(', ')}` : ''}${list[0]!.path ? `, \`${list[0]!.path.split('?')[0]}\`` : ''}).` +
          (means ? ` ${means}` : '')
      );
    }
    say('');
  }
  if (badPolls.length > 0) {
    say(
      `**Our own status checks**: ${badPolls.length} of ${results.calls.filter((c) => c.phase === 'poll').length} failed (${[...new Set(badPolls.map((c) => c.status))].join(', ')}). They do not affect the students, but a status seen late makes the waits above look longer.`,
      ''
    );
  }

  const logErrors = results.logErrors ?? [];
  if (logErrors.length > 0) {
    say(
      '**Errors in the service logs** during the run (all users, identical lines counted together):',
      ''
    );
    for (const e of logErrors.slice(0, 15)) {
      say(
        `- ${e.service}, ${e.count}×, first at ${utc(e.first)} UTC: \`${e.message.slice(0, 260)}\``
      );
    }
    say('');
  }
}

function renderNotChecked(results: Results, say: (...t: string[]) => void): void {
  say('## Not checked', '');
  for (const item of results.notChecked) say(`- ${item}`);
  say('');
}

if (import.meta.main) {
  const file = process.argv[2];
  if (!file) throw new Error('usage: bun stress/report.ts <results.json>');
  const results = (await Bun.file(file).json()) as Results;
  const out = file.replace(/results\.json$/, 'report.md');
  await Bun.write(out, renderReport(results));
  console.log(out);
}
