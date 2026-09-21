/** Health checks for the backend services. */

import { Result } from 'better-result';

import { describe, type RequestError } from './errors';
import { request, requestJson } from './http';
import { checkableServices, type Service } from './services';

export type ServiceStatus = {
  service: Service;
  healthy: boolean;
  version?: string;
  problem?: string;
};

type VersionFields = { version?: string; app_version?: string; app_name?: string };
type VersionPayload = VersionFields & { data?: VersionFields };

async function readVersion(url: string): Promise<string | undefined> {
  const payload = await requestJson<VersionPayload>(url);
  if (Result.isError(payload)) return undefined;
  const fields = payload.value.data ?? payload.value;
  return fields.version ?? fields.app_version;
}

/** Calls one service's health URL, and its version URL when it has one. */
export async function checkService(service: Service): Promise<ServiceStatus> {
  const health = await request(service.healthUrl);

  if (Result.isError(health)) {
    return { service, healthy: false, problem: describe(health.error as RequestError) };
  }

  return {
    service,
    healthy: true,
    version: service.versionUrl ? await readVersion(service.versionUrl) : undefined,
  };
}

export function checkAllServices(): Promise<ServiceStatus[]> {
  return Promise.all(checkableServices().map(checkService));
}

/** The statuses as aligned lines for the console. */
export function formatStatusTable(statuses: ServiceStatus[]): string {
  const width = Math.max(...statuses.map((s) => s.service.label.length));

  return statuses
    .map((status) => {
      const name = status.service.label.padEnd(width);
      if (!status.healthy) return `  FAIL  ${name}  ${status.problem}`;
      return `  ok    ${name}  ${status.version ?? ''}`.trimEnd();
    })
    .join('\n');
}
