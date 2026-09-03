import { Result } from 'better-result';

import { describe, type RequestError } from './errors';
import { request, requestJson } from './http';
import { checkableServices, type Service } from './services';

export type ServiceStatus = {
  service: Service;
  healthy: boolean;
  /** Reported version, when the service exposes one. */
  version?: string;
  problem?: string;
};

type VersionPayload = { version?: string; app_version?: string; app_name?: string };

async function readVersion(url: string): Promise<string | undefined> {
  const payload = await requestJson<VersionPayload>(url);
  if (Result.isError(payload)) return undefined;
  return payload.value.version ?? payload.value.app_version;
}

export async function checkService(service: Service): Promise<ServiceStatus> {
  // Health answers vary across services: `"OK"`, `{ status: "OK" }`, `{ status:
  // "ok" }`. Any 2xx counts, so do not require a shape.
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

/** Checks every service a run can reach, in parallel. */
export function checkAllServices(): Promise<ServiceStatus[]> {
  return Promise.all(checkableServices().map(checkService));
}

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
