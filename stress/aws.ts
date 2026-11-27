/**
 * Watches the launch system's machines on AWS while a stress run is in flight.
 *
 * Read-only: every call is a describe/list/get. The AWS CLI runs through Bun's
 * shell, with the SSO profile of the deployment (`aws sso login --profile staging`).
 *
 * Two layers, both polled because ECS keeps no history we could ask for later:
 * - containers: one ECS task per simulation job in `launch_system_executor`,
 *   tagged `JobId`. Its createdAt → startedAt is the spin-up, stoppingAt →
 *   stoppedAt the shut-down. ECS forgets stopped tasks after about an hour, so
 *   each task is described as soon as it is seen and again once it stops.
 * - machines: the EC2 autoscaling group the tasks land on. Its desired and
 *   in-service counts over time say how fast machines were added.
 */

import { $ } from 'bun';

export const EXECUTOR_CLUSTER = 'launch_system_executor';

export type Container = {
  taskArn: string;
  jobId?: string;
  launchType?: string;
  cpu?: string;
  memory?: string;
  createdAt?: number;
  pullStartedAt?: number;
  pullStoppedAt?: number;
  startedAt?: number;
  stoppingAt?: number;
  stoppedAt?: number;
  stopCode?: string;
  stoppedReason?: string;
  exitCode?: number;
  lastStatus?: string;
};

export type MachineSample = {
  at: number;
  desired: number;
  inService: number;
  pending: number;
  terminating: number;
};

export type ScalingActivity = { start: number; end?: number; status: string; what: string };

type Json = Record<string, unknown>;

const avg = (points: Json[]) =>
  points.reduce((sum, p) => sum + Number(p.Average), 0) / points.length;

const time = (value: unknown): number | undefined =>
  typeof value === 'string' ? Date.parse(value) : undefined;

export class AwsWatch {
  readonly containers = new Map<string, Container>();
  readonly machines: MachineSample[] = [];
  asgName?: string;
  private readonly env: Record<string, string>;

  constructor(
    profile: string,
    /** Server time; see `now` in seminar.ts. */
    private readonly now: () => number = Date.now,
    readonly region = 'us-east-1'
  ) {
    this.env = {
      ...(process.env as Record<string, string>),
      AWS_PROFILE: profile,
      AWS_REGION: region,
      AWS_PAGER: '',
    };
  }

  private async aws(args: string[]): Promise<Json> {
    const out = await $`aws ${args} --output json`.env(this.env).quiet();
    const text = out.stdout.toString().trim();
    return text ? (JSON.parse(text) as Json) : {};
  }

  /** Throws a readable error when the SSO login has lapsed. */
  async check(): Promise<void> {
    try {
      await this.aws(['sts', 'get-caller-identity']);
    } catch (cause) {
      const stderr = (cause as { stderr?: Buffer }).stderr?.toString() ?? String(cause);
      throw new Error(`AWS is not reachable: ${stderr.trim()}`, { cause });
    }
    this.asgName = await this.findAsg();
  }

  /** The autoscaling group behind the executor's EC2 capacity provider. */
  private async findAsg(): Promise<string | undefined> {
    const cluster = await this.aws(['ecs', 'describe-clusters', '--clusters', EXECUTOR_CLUSTER]);
    const providers = ((cluster.clusters as Json[])?.[0]?.capacityProviders as string[]) ?? [];
    if (providers.length === 0) return undefined;
    const described = await this.aws([
      'ecs',
      'describe-capacity-providers',
      '--capacity-providers',
      ...providers,
    ]);
    for (const provider of (described.capacityProviders as Json[]) ?? []) {
      const arn = (provider.autoScalingGroupProvider as Json | undefined)?.autoScalingGroupArn;
      if (typeof arn === 'string') return arn.split('autoScalingGroupName/')[1];
    }
    return undefined;
  }

  /** One poll: running/pending containers, newly stopped ones, and the machine count. */
  async sample(): Promise<void> {
    const [running, stopped] = await Promise.all(
      ['RUNNING', 'STOPPED'].map((status) =>
        this.aws([
          'ecs',
          'list-tasks',
          '--cluster',
          EXECUTOR_CLUSTER,
          '--desired-status',
          status,
        ]).then((r) => (r.taskArns as string[]) ?? [])
      )
    );
    // Describe what is new, what still runs (its status moves), and what stopped
    // since we last saw it running. Finished-and-recorded tasks are skipped: the
    // poll then costs a list call, not a describe of the whole hour's history.
    const stale = [
      ...(running ?? []),
      ...(stopped ?? []).filter((arn) => !this.containers.get(arn)?.stoppedAt),
    ];
    await this.describe(stale);
    if (this.asgName) this.machines.push(await this.machineSample(this.asgName));
  }

  /** Describes up to 100 tasks per call, the ECS limit. */
  async describe(arns: string[]): Promise<void> {
    for (let i = 0; i < arns.length; i += 100) {
      const batch = arns.slice(i, i + 100);
      const out = await this.aws([
        'ecs',
        'describe-tasks',
        '--cluster',
        EXECUTOR_CLUSTER,
        '--include',
        'TAGS',
        '--tasks',
        ...batch,
      ]);
      for (const task of (out.tasks as Json[]) ?? []) {
        const tags = (task.tags as { key: string; value: string }[]) ?? [];
        const arn = task.taskArn as string;
        this.containers.set(arn, {
          taskArn: arn,
          jobId: tags.find((t) => t.key === 'JobId')?.value,
          launchType: task.launchType as string,
          cpu: task.cpu as string,
          memory: task.memory as string,
          createdAt: time(task.createdAt),
          pullStartedAt: time(task.pullStartedAt),
          pullStoppedAt: time(task.pullStoppedAt),
          startedAt: time(task.startedAt),
          stoppingAt: time(task.stoppingAt),
          stoppedAt: time(task.stoppedAt),
          stopCode: task.stopCode as string,
          stoppedReason: task.stoppedReason as string,
          exitCode: ((task.containers as Json[])?.[0]?.exitCode as number) ?? undefined,
          lastStatus: task.lastStatus as string,
        });
      }
    }
  }

  private async machineSample(asg: string): Promise<MachineSample> {
    const out = await this.aws([
      'autoscaling',
      'describe-auto-scaling-groups',
      '--auto-scaling-group-names',
      asg,
    ]);
    const group = (out.AutoScalingGroups as Json[])?.[0] ?? {};
    const states = ((group.Instances as Json[]) ?? []).map((i) => String(i.LifecycleState));
    return {
      at: this.now(),
      desired: Number(group.DesiredCapacity ?? 0),
      inService: states.filter((s) => s === 'InService').length,
      pending: states.filter((s) => s.startsWith('Pending')).length,
      terminating: states.filter((s) => s.startsWith('Terminating')).length,
    };
  }

  /** Scale-out and scale-in events of the machine group inside a time window. */
  async scalingActivities(from: number): Promise<ScalingActivity[]> {
    if (!this.asgName) return [];
    const out = await this.aws([
      'autoscaling',
      'describe-scaling-activities',
      '--auto-scaling-group-name',
      this.asgName,
      '--max-items',
      '200',
    ]);
    return ((out.Activities as Json[]) ?? [])
      .map((a) => ({
        start: time(a.StartTime) ?? 0,
        end: time(a.EndTime),
        status: String(a.StatusCode),
        what: String(a.Description),
      }))
      .filter((a) => a.start >= from);
  }

  /**
   * Peak and average of a CloudWatch metric over the run, and its average in
   * the ten minutes before, so the report can say what the load added.
   * One-minute periods: the finest the ECS and RDS basic metrics have.
   */
  async metric(
    namespace: string,
    name: string,
    dimensions: Record<string, string>,
    from: number,
    to: number,
    stat = 'Maximum'
  ): Promise<{ peak: number; average: number; before?: number } | undefined> {
    const dims = Object.entries(dimensions).map(([k, v]) => `Name=${k},Value=${v}`);
    const read = async (start: number, end: number) => {
      const out = await this.aws([
        'cloudwatch',
        'get-metric-statistics',
        '--namespace',
        namespace,
        '--metric-name',
        name,
        '--dimensions',
        ...dims,
        '--start-time',
        new Date(start).toISOString(),
        '--end-time',
        new Date(end).toISOString(),
        '--period',
        '60',
        '--statistics',
        stat,
        'Average',
      ]);
      return (out.Datapoints as Json[]) ?? [];
    };
    const during = await read(from, Math.max(to, from + 60_000));
    if (during.length === 0) return undefined;
    const before = await read(from - 10 * 60_000, from);
    return {
      peak: Math.max(...during.map((p) => Number(p[stat]))),
      average: avg(during),
      before: before.length ? avg(before) : undefined,
    };
  }

  /** Raw log lines matching a CloudWatch filter pattern, oldest first, at most `limit`. */
  async logLines(
    group: string,
    pattern: string,
    from: number,
    to: number,
    limit = 50
  ): Promise<string[]> {
    const out = await this.aws([
      'logs',
      'filter-log-events',
      '--log-group-name',
      group,
      '--filter-pattern',
      pattern,
      '--start-time',
      String(from),
      '--end-time',
      String(to),
      '--max-items',
      String(limit),
    ]);
    return ((out.events as Json[]) ?? []).map((e) => String(e.message).trim());
  }

  /**
   * Runs a Logs Insights query over the run's window and returns its rows.
   * Polls the query every 2 s; Insights answers within seconds for an hour of logs.
   */
  async insights(group: string, query: string, from: number, to: number): Promise<Json[]> {
    const started = await this.aws([
      'logs',
      'start-query',
      '--log-group-name',
      group,
      '--start-time',
      String(Math.floor(from / 1000)),
      '--end-time',
      String(Math.ceil(to / 1000)),
      '--query-string',
      query,
    ]);
    const id = started.queryId as string;
    for (let i = 0; i < 60; i++) {
      await Bun.sleep(2000);
      const out = await this.aws(['logs', 'get-query-results', '--query-id', id]);
      if (out.status === 'Complete') {
        return ((out.results as { field: string; value: string }[][]) ?? []).map((row) =>
          Object.fromEntries(row.map((cell) => [cell.field, cell.value]))
        );
      }
      if (out.status === 'Failed' || out.status === 'Cancelled') return [];
    }
    return [];
  }
}
