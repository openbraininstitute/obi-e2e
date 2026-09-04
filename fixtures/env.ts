import * as fs from 'node:fs';
import * as path from 'node:path';

export const isCI = Boolean(process.env.CI);

export const baseURL = process.env.E2E_BASE_URL ?? 'https://staging.openbraininstitute.org';

/** The deployments the suite knows how to run against. */
export const DEPLOYMENT_ENVS = ['staging', 'production'] as const;
export type DeploymentEnv = (typeof DEPLOYMENT_ENVS)[number];

/**
 * Which deployment this run is pointed at.
 *
 * Everything that differs between deployments hangs off this: which workflows
 * exist, and which host serves the backend. It is derived from the one URL a
 * run is already given rather than configured a second time, so the two cannot
 * disagree. `E2E_ENV` names it outright for a host this cannot read, such as a
 * preview build of the production release.
 *
 * @throws Error when `E2E_ENV` names a deployment that does not exist.
 */
export function deploymentEnv(): DeploymentEnv {
  const declared = process.env.E2E_ENV;
  if (declared) {
    if (!DEPLOYMENT_ENVS.includes(declared as DeploymentEnv)) {
      throw new Error(`E2E_ENV must be one of ${DEPLOYMENT_ENVS.join(', ')}, got "${declared}".`);
    }
    return declared as DeploymentEnv;
  }

  // Production is the only host without a prefix. Staging, a preview build and
  // a local application are all the same thing to a test: not production.
  const host = new URL(baseURL).hostname;
  return host === 'openbraininstitute.org' || host === 'www.openbraininstitute.org'
    ? 'production'
    : 'staging';
}

/**
 * Where the backend services answer, which is not where the application does.
 * Production serves them from its own host; staging keeps them on a cell.
 */
export function cellApiUrl(): string {
  return deploymentEnv() === 'production'
    ? 'https://www.openbraininstitute.org/api'
    : 'https://staging.cell-a.openbraininstitute.org/api';
}

/** The virtual lab manager sits on a different host from the application. */
export function virtualLabApiUrl(): string {
  const url = process.env.VIRTUAL_LAB_API_URL;
  if (!url) {
    throw new Error('VIRTUAL_LAB_API_URL is not set. See .env.example for the staging value.');
  }
  return url.replace(/\/$/, '');
}

export const RUN_ID = process.env.E2E_RUN_ID ?? `${Date.now()}-${process.pid}`;

// Worker processes re-evaluate this module and would otherwise each generate a
// different id. Pinning it here makes every worker share one run directory.
process.env.E2E_RUN_ID = RUN_ID;

/** When the run began, pinned across workers the same way the id is. */
export const RUN_STARTED_AT = process.env.E2E_RUN_STARTED_AT ?? new Date().toISOString();
process.env.E2E_RUN_STARTED_AT = RUN_STARTED_AT;

/**
 * The commit under test.
 *
 * CI already knows it. Locally it is worth asking git, because a record that
 * outlives the working tree needs to say which code produced it.
 */
export function commit(): string {
  const fromCI = process.env.GITHUB_SHA;
  if (fromCI) return fromCI;

  const result = Bun.spawnSync(['git', 'rev-parse', 'HEAD']);
  return result.success ? result.stdout.toString().trim() : 'unknown';
}

export const RUN_DIR = path.resolve(process.cwd(), '.e2e-runs', RUN_ID);

/**
 * The suite is split by what each user is responsible for.
 *
 * `primary` owns one established virtual lab and covers the work inside it:
 * workflows, data, notebooks. It never creates or deletes a lab.
 *
 * `onboarding` starts owning nothing and covers everything before that point:
 * creating a lab, creating projects, and inviting members. It deletes what it
 * creates, because a user may own only one lab.
 */
export const ROLES = ['primary', 'onboarding'] as const;
export type Role = (typeof ROLES)[number];

const CREDENTIAL_VARS = {
  primary: ['E2E_TEST_USERNAME', 'E2E_TEST_PASSWORD'],
  onboarding: ['E2E_ONBOARDING_USERNAME', 'E2E_ONBOARDING_PASSWORD'],
} as const satisfies Record<Role, readonly [string, string]>;

export function authStatePath(role: Role): string {
  return path.join(RUN_DIR, 'auth', `${role}.json`);
}

export function tokenPath(role: Role): string {
  return path.join(RUN_DIR, 'auth', `${role}.token`);
}

/** Whether a role's credentials are configured. `onboarding` is optional. */
export function hasCredentials(role: Role): boolean {
  return CREDENTIAL_VARS[role].every((name) => Boolean(process.env[name]));
}

export function credentials(role: Role): { username: string; password: string } {
  const [usernameVar, passwordVar] = CREDENTIAL_VARS[role];
  const missing = CREDENTIAL_VARS[role].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing credentials for the ${role} user: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill it in, or set them as CI secrets.'
    );
  }

  return {
    username: process.env[usernameVar] as string,
    password: process.env[passwordVar] as string,
  };
}

/**
 * What the run hands the project it creates, and so the most the whole suite
 * may spend. A first guess until a few full runs say what a run really costs;
 * `E2E_PROJECT_CREDITS` is how that number is corrected without a code change.
 */
export const PROJECT_CREDITS = readCredits();

function readCredits(): number {
  const raw = process.env.E2E_PROJECT_CREDITS;
  if (!raw) return 2_000;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`E2E_PROJECT_CREDITS must be a positive number, got "${raw}".`);
  }
  return parsed;
}

/**
 * Where the run records the project it made for itself. Written by the
 * workspace setup and read by every worker, the same way the auth state is.
 */
export function workspacePath(): string {
  return path.join(RUN_DIR, 'workspace.json');
}

type RequiredVar = 'LAB_ID';

/**
 * Reads required environment variables.
 *
 * @throws Error naming every missing variable at once, so a misconfigured run
 * reports all of them instead of one per rerun.
 */
export function requireEnv<T extends RequiredVar>(...keys: T[]): Record<T, string> {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill it in, or set them as CI secrets.'
    );
  }

  return Object.fromEntries(keys.map((key) => [key, process.env[key] as string])) as Record<
    T,
    string
  >;
}

/**
 * The only lab and project tests may write to.
 *
 * The lab is long-lived and named by the environment. The project never is: the
 * run creates one, spends inside it and deletes it, so many runs can share one
 * lab without sharing state or racing each other's data. There is deliberately
 * no way to point a run at a project that already exists — a run that wrote
 * into someone's project would leave data behind in it.
 */
export function testWorkspace(): { labId: string; projectId: string } {
  const labId = requireEnv('LAB_ID').LAB_ID;

  const file = workspacePath();
  if (!fs.existsSync(file)) {
    throw new Error(
      `This run has no project: ${file} was never written. The workspace setup ` +
        'creates one, so run through the suite rather than a spec on its own — ' +
        '`bun run test <spec>` still sets it up first.'
    );
  }

  const workspace = JSON.parse(fs.readFileSync(file, 'utf8')) as { projectId?: string };
  if (!workspace.projectId) throw new Error(`${file} names no project.`);

  return { labId, projectId: workspace.projectId };
}

export function resolveWorkers(): number {
  const explicit = Number.parseInt(process.env.PLAYWRIGHT_WORKERS ?? '', 10);
  if (Number.isInteger(explicit) && explicit > 0) return explicit;
  return isCI ? 2 : 3;
}

type Devices = Record<string, object>;

export function resolveBrowser(devices: Devices) {
  const channel = process.env.PLAYWRIGHT_BROWSER_CHANNEL;

  switch (process.env.PLAYWRIGHT_BROWSER) {
    case 'firefox':
      return devices['Desktop Firefox'];
    case 'webkit':
      return devices['Desktop Safari'];
    default:
      return { ...devices['Desktop Chrome'], ...(channel ? { channel } : {}) };
  }
}
