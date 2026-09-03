import * as path from 'node:path';

export const isCI = Boolean(process.env.CI);

export const baseURL = process.env.E2E_BASE_URL ?? 'https://staging.openbraininstitute.org';

export const RUN_ID = process.env.E2E_RUN_ID ?? `${Date.now()}-${process.pid}`;

// Worker processes re-evaluate this module and would otherwise each generate a
// different id. Pinning it here makes every worker share one run directory.
process.env.E2E_RUN_ID = RUN_ID;

export const RUN_DIR = path.resolve(process.cwd(), '.e2e-runs', RUN_ID);

export const AUTH_STATE_PATH =
  process.env.E2E_AUTH_STATE_PATH ?? path.join(RUN_DIR, 'auth', 'user.json');

type RequiredVar = 'E2E_TEST_USERNAME' | 'E2E_TEST_PASSWORD' | 'LAB_ID' | 'PROJECT_ID';

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

export function testUser() {
  const env = requireEnv('E2E_TEST_USERNAME', 'E2E_TEST_PASSWORD');
  return { username: env.E2E_TEST_USERNAME, password: env.E2E_TEST_PASSWORD };
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
