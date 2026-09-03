import { kebabCase } from 'es-toolkit';

/**
 * The entity types the application knows about.
 *
 * Mirrors `src/api/entitycore/types/entity-type.ts` and
 * `extended-entity-type.ts` in `core-web-app`. It is a copy because the two
 * repositories are separate, so it can drift. The listing tests catch that:
 * every slug here is opened against the running application, and a type the
 * application no longer serves fails there.
 */
export const EntityTypeDict = {
  AnalysisNotebookResult: 'analysis_notebook_result',
  AnalysisNotebookTemplate: 'analysis_notebook_template',
  AnalysisSoftwareSourceCode: 'analysis_software_source_code',
  BrainAtlas: 'brain_atlas',
  BrainAtlasRegion: 'brain_atlas_region',
  CellComposition: 'cell_composition',
  CellMorphology: 'cell_morphology',
  Circuit: 'circuit',
  CircuitExtractionCampaign: 'circuit_extraction_campaign',
  CircuitExtractionConfig: 'circuit_extraction_config',
  EFeatureExtractionCampaign: 'efeature_extraction_campaign',
  EFeatureExtractionConfig: 'efeature_extraction_config',
  EFeatureExtractionResult: 'efeature_extraction_result',
  ElectricalCellRecording: 'electrical_cell_recording',
  EMCellMesh: 'em_cell_mesh',
  Emodel: 'emodel',
  EmSynapseMappingCampaign: 'em_synapse_mapping_campaign',
  EmSynapseMappingConfig: 'em_synapse_mapping_config',
  ExperimentalBoutonDensity: 'experimental_bouton_density',
  ExperimentalNeuronDensity: 'experimental_neuron_density',
  ExperimentalSynapsesPerConnection: 'experimental_synapses_per_connection',
  IonChannelModel: 'ion_channel_model',
  IonChannelModelingCampaign: 'ion_channel_modeling_campaign',
  IonChannelModelingConfig: 'ion_channel_modeling_config',
  IonChannelRecording: 'ion_channel_recording',
  Memodel: 'memodel',
  Mesh: 'mesh',
  Simulation: 'simulation',
  SimulatableExtracellularRecordingArray: 'simulatable_extracellular_recording_array',
  SimulationCampaign: 'simulation_campaign',
  SingleNeuronSimulation: 'single_neuron_simulation',
  SingleNeuronSynaptome: 'single_neuron_synaptome',
  SingleNeuronSynaptomeSimulation: 'single_neuron_synaptome_simulation',
  SkeletonizationCampaign: 'skeletonization_campaign',
  Subject: 'subject',
  SynapticPathway: 'synaptic_pathway',
  TaskConfig: 'task_config',
  TaskResult: 'task_result',
  ValidationResult: 'validation_result',
} as const;

export const ExtendedEntitiesTypeDict = {
  ...EntityTypeDict,
  BrainRegion: 'brain_region',
  BrainSystems: 'brain_system',
  BuildSynaptomeCampaign: 'build_synaptome_campaign',
  ExtracellularRecordingArrayCampaign: 'extracellular_recording_array_campaign',
  IonChannelModelSimulation: 'ion_channel_model_simulation',
  MemodelCircuit: 'me_model_circuit',
  MemodelCircuitSimulation: 'me_model_circuit_simulation',
  Metabolism: 'metabolism',
  Microcircuit: 'micro_circuit',
  MicrocircuitSimulation: 'microcircuit_simulation',
  NGVCircuit: 'ngv_circuit',
  NGVUnit: 'ngv_unit',
  PairedNeuronCircuit: 'paired_neuron_circuit',
  PairedNeuronCircuitSimulation: 'paired_neuron_circuit_simulation',
  RegionCircuitSimulation: 'region_circuit_simulation',
  SingleNeuronCircuit: 'single_neuron_circuit',
  SingleNeuronCircuitSimulation: 'single_neuron_circuit_simulation',
  SmallMicrocircuit: 'small_micro_circuit',
  SmallMicrocircuitSimulation: 'small_microcircuit_simulation',
  SynthesizedCellMorphology: 'synthesized_cell_morphology',
  UniversalCellMorphology: 'universal_cell_morphology',
  WholeBrain: 'whole_brain',
  WholeBrainCircuitSimulation: 'whole_brain_circuit_simulation',
} as const;

export type TExtendedEntitiesTypeDict =
  (typeof ExtendedEntitiesTypeDict)[keyof typeof ExtendedEntitiesTypeDict];

/**
 * The last segment of a listing URL. The application builds it the same way,
 * so the slug never has to be written down twice.
 */
export function entitySlug(type: TExtendedEntitiesTypeDict): string {
  return kebabCase(type);
}
