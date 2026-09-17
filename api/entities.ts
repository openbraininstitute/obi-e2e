/** Reading one entity the fixture names by id. */

import { EntityTypeDict } from '@fixtures/entity-types';
import { cellApiUrl } from '@fixtures/run/env';
import { accessToken } from '@fixtures/run/token';
import { Result } from 'better-result';
import { kebabCase } from 'es-toolkit';

import { describe } from './errors';
import { requestJson } from './http';

export type EntityTypeName = keyof typeof EntityTypeDict;

/**
 * The name of the entity with this id.
 *
 * A fixture names an entity by id when the name is not unique — staging holds two
 * public "C190101A1-MT-C1" recordings — but a picker searches by name, so the id
 * has to be read into one.
 */
export async function entityName(type: EntityTypeName, id: string): Promise<string> {
  const url = `${cellApiUrl()}/entitycore/${kebabCase(EntityTypeDict[type])}/${id}`;

  const answer = await requestJson<{ name?: string }>(url, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
  });

  if (Result.isError(answer)) {
    throw new Error(`No ${type} with id ${id}: ${describe(answer.error)}`);
  }

  const name = answer.value.name;
  if (!name) throw new Error(`The ${type} ${id} has no name, so no picker can be searched for it.`);

  return name;
}
