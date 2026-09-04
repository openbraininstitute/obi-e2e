import { cellApiUrl } from '@fixtures/env';

/**
 * The backend services the application talks to.
 *
 * Every entry is checked before the suite runs, so a red suite caused by a down
 * service is reported as a down service instead of as failing tests.
 */
export type Service = {
  key: string;
  label: string;
  envVar: string;
  baseUrl: string;
  healthUrl: string;
  versionUrl?: string;
  /** Reachable only from inside the VPC, so it cannot be checked from CI. */
  vpcOnly: boolean;
};

type Definition = {
  key: string;
  label: string;
  envVar: string;
  /** Where the service sits under the deployment's API host. */
  path: string;
  /** Appended to the base URL. Verified against staging. */
  health?: string;
  version?: string;
  vpcOnly?: boolean;
  /** Some services host health outside their versioned base. */
  healthBase?: (baseUrl: string) => string;
};

const DEFINITIONS: Definition[] = [
  {
    key: 'entitycore',
    label: 'Entity core',
    envVar: 'ENTITY_CORE_URL',
    path: '/entitycore',
    version: '/version',
  },
  {
    key: 'virtual-lab',
    label: 'Virtual lab manager',
    envVar: 'VIRTUAL_LAB_API_URL',
    path: '/virtual-lab-manager',
  },
  {
    key: 'obi-one',
    label: 'OBI One',
    envVar: 'OBI_ONE_URL',
    path: '/obi-one',
    version: '/version',
  },
  {
    key: 'circuit',
    label: 'Circuit',
    envVar: 'CELL_API_URL',
    path: '/circuit',
    version: '/version',
  },
  {
    key: 'notebook',
    label: 'Notebook service',
    envVar: 'NOTEBOOK_API_URL',
    path: '/notebook_service',
  },
  {
    key: 'thumbnail',
    label: 'Thumbnail generation',
    envVar: 'THUMBNAIL_API_URL',
    path: '/thumbnail-generation',
  },
  {
    key: 'simulator',
    label: 'Small scale simulator',
    envVar: 'SMALL_SCALE_SIMULATOR_URL',
    path: '/small-scale-simulator',
  },
  {
    key: 'ai-agent',
    label: 'AI agent',
    envVar: 'AI_AGENT_URL',
    path: '/agent-ts/api',
    // This one answers on /healthz; /health is a 404.
    health: '/healthz',
    version: '/version',
  },
  {
    key: 'auth-manager',
    label: 'Auth manager',
    envVar: 'AUTH_MANAGER_URL',
    path: '/auth-manager/v1',
    // Health sits above the versioned path.
    healthBase: (baseUrl) => baseUrl.replace(/\/v\d+$/, ''),
  },
  {
    key: 'launch-system',
    label: 'Launch system',
    envVar: 'LAUNCH_SYSTEM_URL',
    path: '/launch-system',
    // From outside the VPC the load balancer redirects to the web application,
    // which answers 200 with HTML. That is not a health signal, so skip it.
    vpcOnly: true,
  },
];

export function services(): Service[] {
  // Read once per call rather than at module load, so a run that sets the
  // deployment from a fixture or the config still gets the right host.
  const apiUrl = cellApiUrl();

  return DEFINITIONS.map((definition) => {
    const fallback = `${apiUrl}${definition.path}`;
    const baseUrl = (process.env[definition.envVar] ?? fallback).replace(/\/$/, '');
    const healthBase = definition.healthBase ? definition.healthBase(baseUrl) : baseUrl;

    return {
      key: definition.key,
      label: definition.label,
      envVar: definition.envVar,
      baseUrl,
      healthUrl: `${healthBase}${definition.health ?? '/health'}`,
      versionUrl: definition.version ? `${baseUrl}${definition.version}` : undefined,
      vpcOnly: definition.vpcOnly ?? false,
    };
  });
}

/** The services a run can actually check. */
export function checkableServices(): Service[] {
  return services().filter((service) => !service.vpcOnly);
}
