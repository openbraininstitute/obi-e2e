/** The backend services this suite checks. */

import { cellApiUrl } from '@fixtures/env';

export type Service = {
  key: string;
  label: string;
  envVar: string;
  baseUrl: string;
  healthUrl: string;
  versionUrl?: string;
  vpcOnly: boolean;
};

type Definition = {
  key: string;
  label: string;
  envVar: string;
  path: string;
  health?: string;
  version?: string;
  vpcOnly?: boolean;
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
    health: '/healthz',
    version: '/version',
  },
  {
    key: 'auth-manager',
    label: 'Auth manager',
    envVar: 'AUTH_MANAGER_URL',
    path: '/auth-manager/v1',
    healthBase: (baseUrl) => baseUrl.replace(/\/v\d+$/, ''),
  },
  {
    key: 'launch-system',
    label: 'Launch system',
    envVar: 'LAUNCH_SYSTEM_URL',
    path: '/launch-system',
    vpcOnly: true,
  },
];

/** Every service. Its URL comes from its env var, or from the deployment. */
export function services(): Service[] {
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

/** The services that can be reached from outside the VPC. */
export function checkableServices(): Service[] {
  return services().filter((service) => !service.vpcOnly);
}
