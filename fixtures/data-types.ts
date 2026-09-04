/** The data types each section of the Data page lists, in order. */

import {
  entitySlug,
  ExtendedEntitiesTypeDict as Type,
  type TExtendedEntitiesTypeDict,
} from './entity-types';

export type DataSectionName = 'experimental' | 'models' | 'simulations';

export type DataType = { type: TExtendedEntitiesTypeDict; label: string; slug: string };

function dataType(type: TExtendedEntitiesTypeDict, label: string): DataType {
  return { type, label, slug: entitySlug(type) };
}

export const DATA_TYPES: Record<DataSectionName, DataType[]> = {
  experimental: [
    dataType(Type.CellMorphology, 'Morphology'),
    dataType(Type.ElectricalCellRecording, 'Single cell electrophysiology'),
    dataType(Type.IonChannelRecording, 'Ion channel electrophysiology'),
    dataType(Type.ExperimentalNeuronDensity, 'Neuron density'),
    dataType(Type.ExperimentalBoutonDensity, 'Bouton density'),
    dataType(Type.ExperimentalSynapsesPerConnection, 'Synapse per connection'),
    dataType(Type.EMCellMesh, 'EM mesh'),
  ],
  models: [
    dataType(Type.IonChannelModel, 'Ion channel model'),
    dataType(Type.SynthesizedCellMorphology, 'Synthesized morphology'),
    dataType(Type.Emodel, 'E-model'),
    dataType(Type.Memodel, 'ME-model'),
    dataType(Type.SingleNeuronCircuit, 'Synaptome'),
    dataType(Type.Circuit, 'Circuit'),
    dataType(Type.SingleNeuronSynaptome, 'Synaptome (legacy)'),
  ],
  simulations: [
    dataType(Type.IonChannelModelSimulation, 'Ion channel'),
    dataType(Type.MemodelCircuitSimulation, 'Single neuron'),
    dataType(Type.SingleNeuronCircuitSimulation, 'Synaptome'),
    dataType(Type.PairedNeuronCircuitSimulation, 'Paired neurons'),
    dataType(Type.SmallMicrocircuitSimulation, 'Small microcircuit'),
    dataType(Type.MicrocircuitSimulation, 'Microcircuit'),
    dataType(Type.WholeBrainCircuitSimulation, 'Whole brain circuit'),
    dataType(Type.SingleNeuronSimulation, 'Single neuron (legacy)'),
    dataType(Type.SingleNeuronSynaptomeSimulation, 'Synaptome (legacy)'),
  ],
};
