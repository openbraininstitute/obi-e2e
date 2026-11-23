/**
 * The three experiments of the UC3M handout (sessions 8 and 9), as the body the
 * web app posts to OBI-ONE's `circuit-simulation-scan-config-generate-grid`.
 *
 * Data, not code: a new experiment is one more entry in EXPERIMENTS. Every
 * list-valued field is a grid axis, and each grid point is one simulation, so
 * `simulations` must equal the product of the list lengths. `experiments.test.ts`
 * checks that.
 */

export type ExperimentId = 1 | 2 | 3;

export type Experiment = {
  id: ExperimentId;
  name: string;
  /** Searched by exact name in entitycore, as the Public tab does. */
  circuit: string;
  /** How many simulations Generate must write. */
  simulations: number;
  /** Everything but `info` and the circuit id, which the run fills in. */
  config: (circuitId: string, population: string) => Record<string, unknown>;
};

const ref = (dict: string, name: string) => ({ block_dict_name: dict, block_name: name });

/** A neuron set of one or more node ids. The handout's "BY ID". */
const byId = (population: string, name: string, ids: number[]) => ({
  type: 'BiophysicalPopulationIDNeuronSet',
  population,
  neuron_ids: { name, elements: ids },
  sample_percentage: 100,
  sample_seed: 1,
});

const pulses = (
  neuronSet: string,
  p: { duration: number; offset: number; width: number; frequency: number },
  timestamps: string | null = null
) => ({
  type: 'MultiPulseCurrentClampSomaticStimulus',
  neuron_set: ref('neuron_sets', neuronSet),
  timestamps: timestamps ? ref('timestamps', timestamps) : null,
  duration: p.duration,
  timestamp_offset: p.offset,
  amplitude: 3,
  width: p.width,
  frequency: p.frequency,
});

const holding = (neuronSet: string, duration: number, amplitude: number | number[]) => ({
  type: 'ConstantCurrentClampSomaticStimulus',
  neuron_set: ref('neuron_sets', neuronSet),
  timestamps: null,
  duration,
  timestamp_offset: 0,
  amplitude,
});

const regular = (start: number) => ({
  type: 'RegularTimestamps',
  start_time: start,
  interval: 1000,
  number_of_repetitions: 2,
});

/** The parts every experiment shares: an empty form, and voltage from every cell. */
function base(
  circuitId: string,
  length: number,
  calcium: number | number[]
): Record<string, unknown> {
  return {
    type: 'CircuitSimulationScanConfig',
    initialize: {
      type: 'CircuitSimulationScanConfig.Initialize',
      circuit: { type: 'CircuitFromID', id_str: circuitId },
      node_set: null,
      simulator: 'NEURON',
      simulation_length: length,
      extracellular_calcium_concentration: calcium,
      v_init: -80,
      random_seed: 1,
    },
    recordings: {
      // A null neuron set is "All Biophysical Neurons", the handout's choice.
      'Soma voltage': { type: 'SomaVoltageRecording', neuron_set: null, dt: 0.1 },
    },
    timestamps: {},
    synaptic_manipulations: {},
    neuronal_manipulations: {},
    distributions: {},
    morphology_locations: {},
  };
}

export const EXPERIMENTS: Record<ExperimentId, Experiment> = {
  1: {
    id: 1,
    name: 'Glutamate',
    circuit: 'nbS1-O1-sSub-post-dim6-nCN-HEX0-L2-01',
    simulations: 2,
    config: (circuitId, population) => ({
      ...base(circuitId, 600, [1.3, 2]),
      neuron_sets: {
        Presynaptic: byId(population, 'Presynaptic', [3]),
        Postsynaptic: byId(population, 'Postsynaptic', [5]),
      },
      stimuli: {
        'Stimulus 0': pulses('Presynaptic', {
          duration: 250,
          offset: 200,
          width: 5,
          frequency: 20,
        }),
      },
    }),
  },
  2: {
    id: 2,
    name: 'GABA',
    circuit: 'nbS1-O1-PV2E-maxNsyn-HEX0-L5',
    simulations: 4,
    config: (circuitId, population) => ({
      ...base(circuitId, 700, 2),
      neuron_sets: {
        Presynaptic: byId(population, 'Presynaptic', [0]),
        Postsynaptic: byId(population, 'Postsynaptic', [1]),
      },
      stimuli: {
        'Stimulus 0': pulses('Presynaptic', {
          duration: 350,
          offset: 200,
          width: 2,
          frequency: 20,
        }),
        'Stimulus 1': holding('Postsynaptic', 700, [-0.3, 0, 0.4, 0.6]),
      },
    }),
  },
  3: {
    id: 3,
    name: 'Integration',
    circuit: 'nbS1-O1-sSub-post-dim6-nCN-HEX0-L2-01',
    simulations: 1,
    config: (circuitId, population) => ({
      ...base(circuitId, 2400, 2),
      neuron_sets: {
        E1: byId(population, 'E1', [3]),
        E2: byId(population, 'E2', [0]),
        Recorded: byId(population, 'Recorded', [5]),
      },
      timestamps: { T_E1: regular(200), T_E2: regular(1200) },
      stimuli: {
        'Stimulus 0': pulses('E1', { duration: 50, offset: 0, width: 5, frequency: 50 }, 'T_E1'),
        'Stimulus 1': pulses('E2', { duration: 50, offset: 0, width: 5, frequency: 50 }, 'T_E2'),
        'Stimulus 2': holding('Recorded', 2400, 0.1),
      },
    }),
  },
};

/** Grid size of a config: the product of the lengths of its list-valued leaves. */
export function gridSize(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => key !== 'neuron_ids')
      .reduce((n, [, v]) => n * gridSize(v), 1);
  }
  return 1;
}
