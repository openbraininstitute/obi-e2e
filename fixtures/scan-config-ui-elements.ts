/**
 * The `ui_element` extension obi-one puts on every schema field, and which the
 * application uses to choose a control.
 *
 * Mirrors `ScanConfigUIElementDict` in core-web-app
 * (`src/features/scan-config/types.ts`). The editor records the value it
 * rendered from on each field, so a test reads it back rather than guessing
 * from the shape of the control.
 */
export const ScanConfigUiElement = {
  // blocks
  BlockUnion: 'block_union',
  BlockSingle: 'block_single',
  BlockDictionary: 'block_dictionary',
  // components
  StringInput: 'string_input',
  ModelIdentifier: 'model_identifier',
  FloatParameterSweep: 'float_parameter_sweep',
  IntParameterSweep: 'int_parameter_sweep',
  Reference: 'reference',
  EntityPropertyDropdown: 'entity_property_dropdown',
  NeuronIds: 'neuron_ids',
  BooleanInput: 'boolean_input',
  IonChannelVariableModificationBySectionList: 'ion_channel_variable_modification_by_section_list',
  IonChannelVariableModificationByNeuron: 'ion_channel_variable_modification_by_neuron',
  ModelSelectorSingle: 'model_selector_single',
  SelectRecordableIonChannelVariable: 'select_recordable_ion_channel_variable',
  VoltageDuration: 'voltage_duration',
  ModelIdentifierMultiple: 'model_identifier_multiple',
  StringSelectionEnhanced: 'string_selection_enhanced',
  NeuronPropertyFilter: 'neuron_property_filter',
  NeuronSetCombination: 'neuron_set_combination',
  MorphologySectionTypeSelection: 'morphology_section_type_selection',
  FloatOptional: 'float_optional',
  SelectEFeaturesByProtocol: 'select_efeatures_by_protocol',
  MorphologyLocationSelection: 'morphology_location_selection',
} as const;

export type TScanConfigUiElement = (typeof ScanConfigUiElement)[keyof typeof ScanConfigUiElement];
