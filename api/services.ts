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
  fallback: string;
  /** Appended to the base URL. Verified against staging. */
  health?: string;
  version?: string;
  vpcOnly?: boolean;
  /** Some services host health outside their versioned base. */
  healthBase?: (baseUrl: string) => string;
};

const CELL = 'https://staging.cell-a.openbraininstitute.org/api';

const DEFINITIONS: Definition[] = [
  {
    key: 'entitycore',
    label: 'Entity core',
    envVar: 'ENTITY_CORE_URL',
    fallback: `${CELL}/entitycore`,
    version: '/version',
  },
  {
    key: 'virtual-lab',
    label: 'Virtual lab manager',
    envVar: 'VIRTUAL_LAB_API_URL',
    fallback: `${CELL}/virtual-lab-manager`,
  },
  {
    key: 'obi-one',
    label: 'OBI One',
    envVar: 'OBI_ONE_URL',
    fallback: `${CELL}/obi-one`,
    version: '/version',
  },
  {
    key: 'circuit',
    label: 'Circuit',
    envVar: 'CELL_API_URL',
    fallback: `${CELL}/circuit`,
    version: '/version',
  },
  {
    key: 'notebook',
    label: 'Notebook service',
    envVar: 'NOTEBOOK_API_URL',
    fallback: `${CELL}/notebook_service`,
  },
  {
    key: 'thumbnail',
    label: 'Thumbnail generation',
    envVar: 'THUMBNAIL_API_URL',
    fallback: `${CELL}/thumbnail-generation`,
  },
  {
    key: 'simulator',
    label: 'Small scale simulator',
    envVar: 'SMALL_SCALE_SIMULATOR_URL',
    fallback: `${CELL}/small-scale-simulator`,
  },
  {
    key: 'ai-agent',
    label: 'AI agent',
    envVar: 'AI_AGENT_URL',
    fallback: `${CELL}/agent-ts/api`,
    // This one answers on /healthz; /health is a 404.
    health: '/healthz',
    version: '/version',
  },
  {
    key: 'auth-manager',
    label: 'Auth manager',
    envVar: 'AUTH_MANAGER_URL',
    fallback: `${CELL}/auth-manager/v1`,
    // Health sits above the versioned path.
    healthBase: (baseUrl) => baseUrl.replace(/\/v\d+$/, ''),
  },
  {
    key: 'launch-system',
    label: 'Launch system',
    envVar: 'LAUNCH_SYSTEM_URL',
    fallback: `${CELL}/launch-system`,
    // From outside the VPC the load balancer redirects to the web application,
    // which answers 200 with HTML. That is not a health signal, so skip it.
    vpcOnly: true,
  },
];

export function services(): Service[] {
  return DEFINITIONS.map((definition) => {
    const baseUrl = (process.env[definition.envVar] ?? definition.fallback).replace(/\/$/, '');
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
