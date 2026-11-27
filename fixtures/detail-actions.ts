/**
 * The action menu on a public entity's detail page, one row per type the
 * data view tests open.
 *
 * Taken from core-web-app's `ActionMenu`: Copy ID is always there. Simulate
 * shows when the type is simulatable and a simulate workflow accepts it.
 * Build shows only when the type is marked buildable and a build workflow
 * accepts it, which today is ion channel electrophysiology alone. Download
 * follows `isDownloadable`. Delete is offered only on a morphology the
 * project owns, so a public entity never has it.
 *
 * A circuit-shaped type decides Simulate from the entity (`has_electrical_cell_models`,
 * and for a plain circuit its scale). The published entities these listings
 * open have models, so Simulate is enabled. A draft or disqualified entity
 * would show it disabled instead.
 */

import { ExtendedEntitiesTypeDict as Type, type TExtendedEntitiesTypeDict } from './entity-types';

export type DetailActionState = 'enabled' | 'disabled' | 'absent';

export type DetailActions = {
  copyId: 'enabled';
  simulate: DetailActionState;
  build: DetailActionState;
  download: DetailActionState;
  delete: 'absent';
};

function row(
  partial: Partial<Pick<DetailActions, 'simulate' | 'build' | 'download'>> = {}
): DetailActions {
  return {
    copyId: 'enabled',
    simulate: 'absent',
    build: 'absent',
    download: 'absent',
    delete: 'absent',
    ...partial,
  };
}

const ACTIONS: Partial<Record<TExtendedEntitiesTypeDict, DetailActions>> = {
  [Type.CellMorphology]: row({ download: 'enabled' }),
  [Type.Circuit]: row({ simulate: 'enabled', download: 'enabled' }),
  [Type.ElectricalCellRecording]: row({ download: 'enabled' }),
  [Type.EMCellMesh]: row({ download: 'enabled' }),
  [Type.Emodel]: row({ download: 'enabled' }),
  [Type.ExperimentalBoutonDensity]: row(),
  [Type.ExperimentalNeuronDensity]: row({ download: 'enabled' }),
  [Type.ExperimentalSynapsesPerConnection]: row({ download: 'enabled' }),
  [Type.IonChannelModel]: row({ simulate: 'enabled', download: 'enabled' }),
  [Type.IonChannelRecording]: row({ build: 'enabled', download: 'enabled' }),
  [Type.Memodel]: row({ simulate: 'enabled', download: 'enabled' }),
  [Type.SingleNeuronCircuit]: row({ download: 'enabled' }),
  [Type.SingleNeuronSimulation]: row({ download: 'enabled' }),
  [Type.SingleNeuronSynaptome]: row({ simulate: 'enabled', download: 'enabled' }),
  [Type.SingleNeuronSynaptomeSimulation]: row({ download: 'enabled' }),
  [Type.SynthesizedCellMorphology]: row({ download: 'enabled' }),
};

/**
 * A finished simulation opens its campaign editor, which has no action menu.
 * The check is that the menu stays absent.
 */
const NO_MENU = new Set<TExtendedEntitiesTypeDict>([
  Type.IonChannelModelSimulation,
  Type.MemodelCircuitSimulation,
  Type.MicrocircuitSimulation,
  Type.PairedNeuronCircuitSimulation,
  Type.SingleNeuronCircuitSimulation,
  Type.SmallMicrocircuitSimulation,
  Type.WholeBrainCircuitSimulation,
]);

/** The menu a public detail page of this type shows. `null` means the page has none. */
export function detailActions(type: TExtendedEntitiesTypeDict): DetailActions | null {
  if (NO_MENU.has(type)) return null;
  const actions = ACTIONS[type];
  if (!actions) {
    throw new Error(
      `No detail-action contract for "${type}". Add one in fixtures/detail-actions.ts ` +
        'from the type flags in core-web-app, for a public entity.'
    );
  }
  return actions;
}
