import { virtualLabApiUrl } from '../fixtures/env';

export type Lab = { id: string; name: string; created_at?: string };
export type Project = { id: string; name: string; created_at?: string };

/** A virtual lab may hold at most this many projects. */
export const PROJECT_LIMIT = 40;

type Json = Record<string, unknown>;

export class VirtualLabApi {
  constructor(
    private readonly token: string,
    private readonly baseUrl = virtualLabApiUrl()
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`${init.method ?? 'GET'} ${path} failed: ${response.status} ${body}`);
    }

    return (body ? JSON.parse(body) : {}) as T;
  }

  /** Unwraps the `{ data: { results: [...] } }` envelope the service returns. */
  private async list<T>(path: string): Promise<T[]> {
    const payload = await this.request<{ data?: Json }>(path);
    const data = payload.data ?? {};
    for (const key of ['results', 'virtual_labs', 'projects']) {
      const value = (data as Json)[key];
      if (Array.isArray(value)) return value as T[];
    }
    return Array.isArray(data) ? (data as T[]) : [];
  }

  listLabs(): Promise<Lab[]> {
    return this.list<Lab>('/virtual-labs?scope=all');
  }

  listProjects(labId: string): Promise<Project[]> {
    return this.list<Project>(`/virtual-labs/${encodeURIComponent(labId)}/projects`);
  }

  async createLab(name: string, description: string): Promise<string> {
    const payload = await this.request<{ data?: { virtual_lab?: Lab }; id?: string }>(
      '/virtual-labs',
      {
        method: 'POST',
        body: JSON.stringify({ name, description, entity: 'E2E Test Organization' }),
      }
    );
    const id = payload.data?.virtual_lab?.id ?? payload.id;
    if (!id)
      throw new Error(`Created a lab but the response carried no id: ${JSON.stringify(payload)}`);
    return id;
  }

  async createProject(labId: string, name: string, description: string): Promise<string> {
    const payload = await this.request<{ data?: { project?: Project }; id?: string }>(
      `/virtual-labs/${encodeURIComponent(labId)}/projects`,
      { method: 'POST', body: JSON.stringify({ name, description, include_members: [] }) }
    );
    const id = payload.data?.project?.id ?? payload.id;
    if (!id)
      throw new Error(
        `Created a project but the response carried no id: ${JSON.stringify(payload)}`
      );
    return id;
  }

  deleteProject(labId: string, projectId: string): Promise<unknown> {
    return this.request(
      `/virtual-labs/${encodeURIComponent(labId)}/projects/${encodeURIComponent(projectId)}`,
      { method: 'DELETE' }
    );
  }

  deleteLab(labId: string): Promise<unknown> {
    return this.request(`/virtual-labs/${encodeURIComponent(labId)}`, { method: 'DELETE' });
  }

  /**
   * The primary user owns exactly one lab, so reuse whatever it already has and
   * only create when it owns none. Never deletes an existing lab.
   */
  async ensureLab(name: string, description: string): Promise<{ id: string; created: boolean }> {
    const existing = await this.listLabs();
    const match = existing.find((lab) => lab.name === name) ?? existing[0];
    if (match) return { id: match.id, created: false };
    return { id: await this.createLab(name, description), created: true };
  }
}
