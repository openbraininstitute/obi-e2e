/**
 * Everything the run reads from its environment.
 *
 * The .env files are read here because Playwright runs its config through Bun
 * in node mode, and Bun loads no file there. Strongest first:
 * the real environment, .env.<deployment>.local, .env.local,
 * .env.<deployment>, .env.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

function parseEnvFile(file: string): Map<string, string> {
  const values = new Map<string, string>();
  if (!fs.existsSync(file)) return values;

  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (line.trimStart().startsWith('#')) continue;

    const match = /^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/.exec(line);
    const key = match?.[1];
    const rawValue = match?.[2];
    if (key === undefined || rawValue === undefined) continue;

    const quoted = /^(['"])([\s\S]*)\1\s*$/.exec(rawValue.trim());
    values.set(key, quoted ? (quoted[2] ?? '') : (rawValue.split('#')[0] ?? '').trim());
  }

  return values;
}

/** The deployment a URL belongs to, by its host. */
export function envOfUrl(url: string | undefined): 'staging' | 'production' | undefined {
  if (!url) return undefined;

  try {
    const host = new URL(url).hostname;
    return host === 'openbraininstitute.org' || host === 'www.openbraininstitute.org'
      ? 'production'
      : 'staging';
  } catch {
    return undefined;
  }
}

/** Names the keys that came from a file, so a real override is never mistaken for one. */
const INJECTED_KEYS = 'E2E_ENV_KEYS_FROM_FILES';

function loadEnvFiles(): void {
  const read = (name: string) => parseEnvFile(path.resolve(process.cwd(), name));
  const shared = read('.env');

  const declared = process.env.E2E_ENV ?? shared.get('E2E_ENV');
  const deployment =
    declared === 'staging' || declared === 'production'
      ? declared
      : (envOfUrl(process.env.E2E_BASE_URL ?? shared.get('E2E_BASE_URL')) ?? 'staging');

  const layers = [
    read(`.env.${deployment}.local`),
    read('.env.local'),
    read(`.env.${deployment}`),
    shared,
  ];

  /*
   * Which keys this process (or the one that spawned it) took from a file.
   *
   * A worker inherits everything the parent injected and cannot otherwise tell
   * those apart from a variable someone exported, so the parent writes the list
   * down and passes it on. What used to stand in for this was "the current
   * value appears in some .env file", which quietly threw away a deliberate
   * override whenever it happened to match one: exporting the real staging URL
   * ran the suite against localhost, because .env.staging names that same URL.
   */
  const injected = new Set((process.env[INJECTED_KEYS] ?? '').split(',').filter(Boolean));

  for (const [index, layer] of layers.entries()) {
    for (const [key, value] of layer) {
      if (layers.slice(0, index).some((higher) => higher.has(key))) continue;

      const current = process.env[key];
      if (current === undefined || current === '' || injected.has(key)) {
        process.env[key] = value;
        injected.add(key);
      }
    }
  }

  process.env[INJECTED_KEYS] = [...injected].join(',');
}

loadEnvFiles();

export const isCI = Boolean(process.env.CI);

export const baseURL = process.env.E2E_BASE_URL || 'https://staging.openbraininstitute.org';

export const DEPLOYMENT_ENVS = ['staging', 'production'] as const;
export type DeploymentEnv = (typeof DEPLOYMENT_ENVS)[number];

/** Which deployment this run tests: staging or production. */
export function deploymentEnv(): DeploymentEnv {
  const declared = process.env.E2E_ENV;
  if (declared) {
    if (!DEPLOYMENT_ENVS.includes(declared as DeploymentEnv)) {
      throw new Error(`E2E_ENV must be one of ${DEPLOYMENT_ENVS.join(', ')}, got "${declared}".`);
    }
    return declared as DeploymentEnv;
  }

  const host = new URL(baseURL).hostname;
  return host === 'openbraininstitute.org' || host === 'www.openbraininstitute.org'
    ? 'production'
    : 'staging';
}

/** Base URL of the backend API for this deployment. */
export function cellApiUrl(): string {
  return deploymentEnv() === 'production'
    ? 'https://www.openbraininstitute.org/api'
    : 'https://staging.cell-a.openbraininstitute.org/api';
}

/** Base URL of the virtual lab manager. */
export function virtualLabApiUrl(): string {
  const url = process.env.VIRTUAL_LAB_API_URL ?? `${cellApiUrl()}/virtual-lab-manager`;
  return url.replace(/\/$/, '');
}

/** Id for this run. Every worker reads the same one from the environment. */
export const RUN_ID = process.env.E2E_RUN_ID ?? `${Date.now()}-${process.pid}`;

process.env.E2E_RUN_ID = RUN_ID;

export const RUN_STARTED_AT = process.env.E2E_RUN_STARTED_AT ?? new Date().toISOString();
process.env.E2E_RUN_STARTED_AT = RUN_STARTED_AT;

/** The commit under test. */
export function commit(): string {
  const fromCI = process.env.GITHUB_SHA;
  if (fromCI) return fromCI;

  const result = Bun.spawnSync(['git', 'rev-parse', 'HEAD']);
  return result.success ? result.stdout.toString().trim() : 'unknown';
}

/** Where this run keeps its sign-ins and its workspace file. */
export const RUN_DIR = path.resolve(process.cwd(), '.e2e-runs', RUN_ID);

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
 * Credits the run moves into its project.
 *
 * Only what a campaign actually spends leaves the lab: the teardown deletes the
 * project and the rest goes back, so the number is a ceiling rather than a cost.
 * It has to clear the priciest single launch in the suite, not just the total —
 * the microcircuit simulation is quoted at ~2,300 on its own, and a project
 * holding less than that is refused at launch with an insufficient-funds 403
 * however little the run has spent so far. A whole `@credits` pass spends
 * roughly 3,700 with that one included, so this leaves it half again as much.
 */
export const PROJECT_CREDITS = readCredits();

function readCredits(): number {
  const raw = process.env.E2E_PROJECT_CREDITS;
  if (!raw) return 6_000;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`E2E_PROJECT_CREDITS must be a positive number, got "${raw}".`);
  }
  return parsed;
}

export function workspacePath(): string {
  return path.join(RUN_DIR, 'workspace.json');
}

type RequiredVar = 'LAB_ID';

/** Reads variables that must be set, or fails naming the missing ones. */
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

/** The lab and the project this run works in. */
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

const MEMORY_PER_WORKER_GB = 1.5;

const MAX_WORKERS = 8;

/**
 * A local server is a Next dev server: one process, compiling each route the
 * first time a test asks for it. Four workers pull twenty listings through it
 * at once and every page takes ten times as long, until `goto` gives up at its
 * minute and assertions miss elements that were only slow. Two keeps it honest.
 */
const MAX_WORKERS_AGAINST_A_LOCAL_SERVER = 2;

function servedLocally(): boolean {
  const host = URL.canParse(baseURL) ? new URL(baseURL).hostname : '';
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

/** Workers a machine can run: one per core, 1.5 GB each, and a ceiling. */
export function workersFor(machine: {
  cpus: number;
  memoryGB: number;
  servedLocally?: boolean;
}): number {
  const byMemory = Math.floor(machine.memoryGB / MEMORY_PER_WORKER_GB);
  const ceiling = machine.servedLocally ? MAX_WORKERS_AGAINST_A_LOCAL_SERVER : MAX_WORKERS;
  return Math.max(1, Math.min(machine.cpus, byMemory, ceiling));
}

/** Workers for this run. PLAYWRIGHT_WORKERS wins when it is set. */
export function resolveWorkers(): number {
  const explicit = Number.parseInt(process.env.PLAYWRIGHT_WORKERS ?? '', 10);
  if (Number.isInteger(explicit) && explicit > 0) return explicit;

  return workersFor({
    cpus: os.availableParallelism?.() ?? os.cpus().length,
    memoryGB: os.totalmem() / 1024 ** 3,
    servedLocally: servedLocally(),
  });
}

type Devices = Record<string, object>;

/** The browser to run, from PLAYWRIGHT_BROWSER. */
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
