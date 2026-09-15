/**
 * Where the mouse atlas lives on this deployment.
 *
 * The species and brain region are a preference the app keeps for the user, not
 * for the tab, so the Data page opens on whatever was last chosen and most
 * species carry no neuron counts. Naming both in the URL outranks the
 * preference without writing it, which choosing in the selector would do.
 *
 * The ids differ between deployments, so they are read once per worker.
 */

import { cellApiUrl } from '@fixtures/run/env';
import { accessToken } from '@fixtures/run/token';
import { SPECIES } from '@locators/atlas';

type MouseAtlas = { hierarchyId: string; regionId: string };

type Hierarchy = { id: string; species: { name: string } | null };

let resolving: Promise<MouseAtlas> | undefined;

async function read<T>(path: string): Promise<T> {
  const response = await fetch(`${cellApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${await accessToken('primary')}` },
  });

  if (!response.ok) {
    throw new Error(`Reading ${path} to find the mouse atlas: ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

async function find(): Promise<MouseAtlas> {
  const hierarchies = await read<{ data: Hierarchy[] }>(
    '/entitycore/brain-region-hierarchy?page_size=100'
  );

  const mouse = hierarchies.data.find((one) => one.species?.name === SPECIES.Mouse);
  if (!mouse) {
    throw new Error(
      `This deployment has no "${SPECIES.Mouse}" brain region hierarchy, so the atlas ` +
        'scenario has nothing to open. It lists: ' +
        `${hierarchies.data.map((one) => one.species?.name ?? 'no species').join(', ')}.`
    );
  }

  const root = await read<{ id: string }>(
    `/entitycore/brain-region-hierarchy/${mouse.id}/hierarchy`
  );

  return { hierarchyId: mouse.id, regionId: root.id };
}

export function mouseAtlas(): Promise<MouseAtlas> {
  resolving ??= find();
  return resolving;
}

/** The Data page, opened on the whole mouse brain whatever the user last chose. */
export async function mouseAtlasRoute(labId: string, projectId: string): Promise<string> {
  const { hierarchyId, regionId } = await mouseAtlas();
  return `/app/virtual-lab/${labId}/${projectId}/data?h_id=${hierarchyId}&br_id=${regionId}&s=focused`;
}
