# Circuit synaptic physiology build

The Circuit synaptic physiology workflow, under Build on the Workflows page. It
gives the synapses of a circuit a physiology: each assignment picks an edge
population and the Tsodyks-Markram model its synapses take, and the build
registers a copy of the circuit with those parameters written into it. obi-one
calls it synapse parameterization; it describes the form, and the seed fills it
in.

The circuit is a neuron pair, one excitatory neuron and the PV cell it targets,
so the build is small enough to finish while the test waits. The seed holds two
configurations, and each one becomes a test of its own. One gives the synapses
between the two neurons a model of its own; the other leaves the model at the
form's default and draws it with two random seeds, so the campaign comes out as
a grid of two coordinates. The seed also says which deployments the workflow
runs on, so no line here does.

User: credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Build" workflow for "Circuit synaptic physiology"
2. Choose the circuit the seed names

Expected:

- "Generate build(s)" is disabled

## Generate a build campaign and launch it

For each: configuration in the seed

Precondition:

1. The Circuit synaptic physiology form is open, with the circuit the seed names chosen

Steps:

1. Fill the form from the configuration in the seed

Expected:

- The button reads "Generate build(s)"
- The button is enabled

Steps:

1. Press "Generate build(s)"

Expected:

- The results tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly: "obi_one_coordinate.json"
- It has produced no outputs yet
- The launch button reads "Launch builds"

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New build campaign"

Steps:

1. Open the results tab again
2. Press "Launch builds"

Expected:

- An estimated cost breakdown is shown, with a "Confirm" to press

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
- The coordinate reaches "done" (within 5 minutes)
- Its inputs are exactly: "Task configuration", "obi_one_coordinate.json" and
  "Circuit directory"
- Its outputs are exactly: "Task logs" and the circuit the build registered,
  "nbS1-O1-E2PV-maxNsyn-HEX0-L2 (synapse-parameterized)"

Steps:

1. Open "Task logs"

Expected:

- The log reads "Task execution completed."
- No entity card sits beside the log

Steps:

1. Open the circuit the build registered

Expected:

- It offers a download and a way to view its details
- Its properties read as the seed says: still a "Pair neuron" of "2" neurons

## Simulate the circuit the build registered

After: Generate a build campaign and launch it

The circuit comes from the first configuration in the seed. It is simulated
with the Paired neurons workflow, the way the original pair is simulated there:
`simulation.json` beside this file holds that configuration. Every build of this
pair registers its copy under the same name, so the circuit is told apart by the
id its card links to.

Seed: simulation.json

Precondition:

1. The build of the first configuration has reached "done"
2. I opened the circuit it registered, and noted which one it is

Steps:

1. Go to the Workflows page, and start the "Simulate" workflow for "Paired neurons"
2. Choose, from my project, the circuit noted
3. Fill the form from the configuration in `simulation.json`, and press
   "Generate simulation(s)"

Expected:

- The simulations tab opens by itself
- There is one coordinate, and it reads "created"
- Its inputs are exactly: "Circuit directory", "node_sets.json",
  "obi_one_coordinate.json" and "simulation_config.json"

Steps:

1. Press "Launch simulations", then "Confirm" under the estimated cost

Expected:

- The coordinate reaches "done" (within 5 minutes)
- Its outputs are exactly: "Recording 0.h5" and "spikes.h5"
- "Recording 0.h5" holds a trace for each of the two neurons,
  "S1nonbarrel_neurons_0" and "S1nonbarrel_neurons_1", against "Time (ms)" and
  "Voltage (mV)"
- "spikes.h5" shows the spikes of "PopulationS1nonbarrel_neurons"
