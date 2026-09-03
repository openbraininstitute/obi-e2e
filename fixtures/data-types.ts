/**
 * Every data type the Data page offers, per section.
 *
 * Read from the running application rather than copied from the product code,
 * so a type disappearing from the UI fails a test instead of quietly matching a
 * stale constant. `slug` is the last segment of the listing URL.
 */
export type DataSectionName = 'experimental' | 'models' | 'simulations';

export type DataType = { label: string; slug: string };

export const DATA_TYPES: Record<DataSectionName, DataType[]> = {
  experimental: [
    { label: 'Morphology', slug: 'cell-morphology' },
    { label: 'Single cell electrophysiology', slug: 'electrical-cell-recording' },
    { label: 'Ion channel electrophysiology', slug: 'ion-channel-recording' },
    { label: 'Neuron density', slug: 'experimental-neuron-density' },
    { label: 'Bouton density', slug: 'experimental-bouton-density' },
    { label: 'Synapse per connection', slug: 'experimental-synapses-per-connection' },
    { label: 'EM mesh', slug: 'em-cell-mesh' },
  ],
  models: [
    { label: 'Ion channel model', slug: 'ion-channel-model' },
    { label: 'Synthesized morphology', slug: 'synthesized-cell-morphology' },
    { label: 'E-model', slug: 'emodel' },
    { label: 'ME-model', slug: 'memodel' },
    { label: 'Synaptome', slug: 'single-neuron-circuit' },
    { label: 'Circuit', slug: 'circuit' },
    { label: 'Synaptome (legacy)', slug: 'single-neuron-synaptome' },
  ],
  simulations: [
    { label: 'Ion channel', slug: 'ion-channel-model-simulation' },
    { label: 'Single neuron', slug: 'me-model-circuit-simulation' },
    { label: 'Synaptome', slug: 'single-neuron-circuit-simulation' },
    { label: 'Paired neurons', slug: 'paired-neuron-circuit-simulation' },
    { label: 'Small microcircuit', slug: 'small-microcircuit-simulation' },
    { label: 'Microcircuit', slug: 'microcircuit-simulation' },
    { label: 'Whole brain circuit', slug: 'whole-brain-circuit-simulation' },
    { label: 'Single neuron (legacy)', slug: 'single-neuron-simulation' },
    { label: 'Synaptome (legacy)', slug: 'single-neuron-synaptome-simulation' },
  ],
};
