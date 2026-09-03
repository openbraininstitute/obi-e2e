import * as path from 'node:path';

export const isCI = Boolean(process.env.CI);

export const baseURL = process.env.E2E_BASE_URL ?? 'https://staging.openbraininstitute.org';

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

type RequiredVar = 'LAB_ID' | 'PROJECT_ID';

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

/** The only lab and project tests may write to. */
export function testWorkspace() {
  const env = requireEnv('LAB_ID', 'PROJECT_ID');
  return { labId: env.LAB_ID, projectId: env.PROJECT_ID };
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
