import * as fs from 'node:fs';
import * as path from 'node:path';

import { VirtualLabApi } from '@api/virtual-lab';

import { RUN_DIR } from './env';
import { log } from './logger';
import { accessToken } from './token';

type OnboardingLab = {
  labId: string;
  /** Only labs created by this run may be deleted. */
  createdByRun: boolean;
  projectIds: string[];
};

type OnboardingResources = {
  labs: OnboardingLab[];
};

export type OnboardingTeardown = {
  removed: 'ok' | 'failed';
  projects: number;
  labs: number;
};

export const onboardingResourcesPath = path.join(RUN_DIR, 'onboarding-resources.json');

function emptyResources(): OnboardingResources {
  return { labs: [] };
}

function readResources(): OnboardingResources {
  if (!fs.existsSync(onboardingResourcesPath)) return emptyResources();

  const parsed = JSON.parse(
    fs.readFileSync(onboardingResourcesPath, 'utf8')
  ) as Partial<OnboardingResources>;
  return {
    labs: (parsed.labs ?? []).map((lab) => ({
      labId: lab.labId,
      createdByRun: Boolean(lab.createdByRun),
      projectIds: [...new Set(lab.projectIds ?? [])],
    })),
  };
}

async function writeResources(resources: OnboardingResources): Promise<void> {
  fs.mkdirSync(RUN_DIR, { recursive: true });
  await Bun.write(onboardingResourcesPath, `${JSON.stringify(resources, null, 2)}\n`);
}

/** Records a lab before any project created inside it is recorded. */
export async function trackOnboardingLab(labId: string, createdByRun: boolean): Promise<void> {
  const resources = readResources();
  const existing = resources.labs.find((lab) => lab.labId === labId);

  if (existing) {
    existing.createdByRun ||= createdByRun;
  } else {
    resources.labs.push({ labId, createdByRun, projectIds: [] });
  }

  await writeResources(resources);
}

/** Records only project IDs returned by the onboarding user's UI/API actions. */
export async function trackOnboardingProject(labId: string, projectId: string): Promise<void> {
  const resources = readResources();
  const lab = resources.labs.find((item) => item.labId === labId);

  if (lab) {
    if (!lab.projectIds.includes(projectId)) lab.projectIds.push(projectId);
  } else {
    resources.labs.push({
      labId,
      createdByRun: false,
      projectIds: [projectId],
    });
  }

  await writeResources(resources);
}

async function removeProject(
  api: VirtualLabApi,
  labId: string,
  projectId: string
): Promise<boolean> {
  try {
    const balance = await api.projectBalance(labId, projectId).catch(() => undefined);
    if (balance && balance.balance > 0) {
      await api.reverseBudget(labId, projectId, balance.balance);
    }

    await api.deleteProject(labId, projectId);
    log.info({ lab: labId, project: projectId }, 'removed onboarding project');
    return true;
  } catch (cause) {
    log.error(
      { lab: labId, project: projectId, reason: String(cause) },
      'could not remove onboarding project'
    );
    return false;
  }
}

/**
 * Removes only resources written to this run's onboarding manifest.
 *
 * Existing onboarding labs are deliberately retained. A run-created lab is
 * deleted only after its tracked projects are gone and the API confirms that
 * no other project has appeared inside it.
 */
export async function teardownOnboardingWorkspace(): Promise<OnboardingTeardown | undefined> {
  if (!fs.existsSync(onboardingResourcesPath)) return undefined;

  const resources = readResources();
  const api = new VirtualLabApi(await accessToken('onboarding'));
  let failed = false;
  let projects = 0;
  let labs = 0;
  const remaining: OnboardingResources = { labs: [] };

  for (const lab of resources.labs) {
    const remainingProjects: string[] = [];

    for (const projectId of lab.projectIds) {
      const removed = await removeProject(api, lab.labId, projectId);
      if (removed) projects += 1;
      else {
        failed = true;
        remainingProjects.push(projectId);
      }
    }

    if (lab.createdByRun && remainingProjects.length === 0) {
      try {
        const otherProjects = await api.listProjects(lab.labId);
        if (otherProjects.length > 0) {
          failed = true;
          log.error(
            {
              lab: lab.labId,
              projects: otherProjects.map((project) => project.id),
            },
            'kept run-created onboarding lab because it contains an untracked project'
          );
          remaining.labs.push({ ...lab, projectIds: [] });
          continue;
        }

        await api.deleteLab(lab.labId);
        labs += 1;
        log.info({ lab: lab.labId }, 'removed onboarding virtual lab');
        continue;
      } catch (cause) {
        failed = true;
        log.error({ lab: lab.labId, reason: String(cause) }, 'could not remove onboarding lab');
      }
    }

    if (remainingProjects.length > 0 || lab.createdByRun) {
      remaining.labs.push({ ...lab, projectIds: remainingProjects });
    }
  }

  if (remaining.labs.length === 0) fs.rmSync(onboardingResourcesPath, { force: true });
  else await writeResources(remaining);

  return { removed: failed ? 'failed' : 'ok', projects, labs };
}
