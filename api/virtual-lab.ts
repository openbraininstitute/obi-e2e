/** Client for the virtual lab manager: labs, projects and credits. */

import { virtualLabApiUrl } from '@fixtures/env';
import { Result } from 'better-result';

import { describe, type RequestError } from './errors';
import { requestJson } from './http';

export type Lab = { id: string; name: string; created_at?: string };
export type Project = { id: string; name: string; created_at?: string };

/** How many projects one lab can hold. */
export const PROJECT_LIMIT = 40;

/** Calls the virtual lab manager as the user the token belongs to. */
export class VirtualLabApi {
  constructor(
    private readonly token: string,
    private readonly baseUrl = virtualLabApiUrl()
  ) {}

  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const result = await requestJson<T>(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...init.headers,
      },
    });

    if (Result.isError(result)) {
      throw new Error(`${init.method ?? 'GET'} ${path}: ${describe(result.error as RequestError)}`);
    }

    return result.value;
  }

  private async list<T>(path: string): Promise<T[]> {
    const payload = await this.call<{ data?: unknown }>(path);
    const data = payload.data;
    if (Array.isArray(data)) return data as T[];

    for (const key of ['results', 'virtual_labs', 'projects']) {
      const value = (data as Record<string, unknown> | undefined)?.[key];
      if (Array.isArray(value)) return value as T[];
    }
    return [];
  }

  listLabs(): Promise<Lab[]> {
    return this.list<Lab>('/virtual-labs?scope=all');
  }

  listProjects(labId: string): Promise<Project[]> {
    return this.list<Project>(`/virtual-labs/${encodeURIComponent(labId)}/projects`);
  }

  async createLab(name: string, description: string): Promise<string> {
    const payload = await this.call<{ data?: { virtual_lab?: Lab }; id?: string }>(
      '/virtual-labs',
      {
        method: 'POST',
        body: JSON.stringify({ name, description, entity: 'E2E Test Organization' }),
      }
    );
    const id = payload.data?.virtual_lab?.id ?? payload.id;
    if (!id) throw new Error('Created a lab but the response carried no id.');
    return id;
  }

  async createProject(labId: string, name: string, description: string): Promise<string> {
    const payload = await this.call<{ data?: { project?: Project }; id?: string }>(
      `/virtual-labs/${encodeURIComponent(labId)}/projects`,
      { method: 'POST', body: JSON.stringify({ name, description, include_members: [] }) }
    );
    const id = payload.data?.project?.id ?? payload.id;
    if (!id) throw new Error('Created a project but the response carried no id.');
    return id;
  }

  deleteProject(labId: string, projectId: string): Promise<unknown> {
    return this.call(
      `/virtual-labs/${encodeURIComponent(labId)}/projects/${encodeURIComponent(projectId)}`,
      { method: 'DELETE' }
    );
  }

  deleteLab(labId: string): Promise<unknown> {
    return this.call(`/virtual-labs/${encodeURIComponent(labId)}`, { method: 'DELETE' });
  }

  private static amount(value: unknown, at: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`${at}: expected a credit amount, got ${JSON.stringify(value)}`);
    }
    return parsed;
  }

  async labBalance(labId: string): Promise<number> {
    const payload = await this.call<{ data?: { balance?: string } }>(
      `/virtual-labs/${encodeURIComponent(labId)}/accounting/balance`
    );
    return VirtualLabApi.amount(payload.data?.balance, 'the lab balance');
  }

  /** What the project holds, and how much of it running work has reserved. */
  async projectBalance(
    labId: string,
    projectId: string
  ): Promise<{ balance: number; reservation: number }> {
    const payload = await this.call<{ data?: { balance?: string; reservation?: string } }>(
      `/virtual-labs/${encodeURIComponent(labId)}/projects/${encodeURIComponent(projectId)}/accounting/balance`
    );
    return {
      balance: VirtualLabApi.amount(payload.data?.balance, 'the project balance'),
      reservation: VirtualLabApi.amount(payload.data?.reservation ?? 0, 'the project reservation'),
    };
  }

  /** Moves credits from the lab into the project. */
  assignBudget(labId: string, projectId: string, amount: number): Promise<unknown> {
    return this.call(
      `/virtual-labs/${encodeURIComponent(labId)}/projects/${encodeURIComponent(projectId)}/accounting/budget/assign`,
      { method: 'POST', body: JSON.stringify({ amount }) }
    );
  }

  /** Moves credits from the project back to the lab. */
  reverseBudget(labId: string, projectId: string, amount: number): Promise<unknown> {
    return this.call(
      `/virtual-labs/${encodeURIComponent(labId)}/projects/${encodeURIComponent(projectId)}/accounting/budget/reverse`,
      { method: 'POST', body: JSON.stringify({ amount }) }
    );
  }

  /** The lab with this name, any other lab the user has, or a new one. */
  async ensureLab(name: string, description: string): Promise<{ id: string; created: boolean }> {
    const existing = await this.listLabs();
    const match = existing.find((lab) => lab.name === name) ?? existing[0];
    if (match) return { id: match.id, created: false };
    return { id: await this.createLab(name, description), created: true };
  }
}
