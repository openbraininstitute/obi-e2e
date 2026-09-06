# Small microcircuit simulation

The Small microcircuit simulation workflow, under Simulate on the Workflows
page. obi-one describes the form, and the seed fills it in, following obi-one's
own circuit simulation example: a neuron set, a clamp on it, and a recording of
it. The circuit is a nine-neuron hippocampal CA1 cylinder.

Nine neurons simulate in about three minutes, so the test follows the run to
the end and reads both files it leaves behind.

The seed also says which deployments the workflow runs on, so no line here does.

Launching prices the simulation first: the estimate is shown and has to be
confirmed before anything starts.

User: lab member, spending credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Simulate" workflow for "Small microcircuit"
2. Choose the circuit the seed names

Expected:

- "Generate simulation(s)" is disabled

## Generate a simulation campaign and launch it

For each: configuration in the seed

Precondition:

1. The Small microcircuit simulation form is open, with the circuit the seed
   names chosen

Steps:

1. Fill the form from the configuration in the seed

Expected:

- The button reads "Generate simulation(s)"
- The button is enabled

Steps:

1. Press "Generate simulation(s)"

Expected:

- The simulations tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly: "circuit_config.json", "node_sets.json",
  "obi_one_coordinate.json" and "simulation_config.json"
- It has produced no outputs yet
- The launch button reads "Launch simulations"

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New simulation campaign"

Steps:

1. Open the simulations tab again
2. Press "Launch simulations"

Expected:

- An estimated cost breakdown is shown, with a "Confirm" to press

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
- The coordinate reaches "done"
- Its outputs are exactly: "Recording 0.h5" and "spikes.h5"

Steps:

1. Open "Recording 0.h5"

Expected:

- There is a trace for "hippocampus_neurons_0", against "Time (ms)" and
  "Voltage (mV)"

Steps:

1. Open "spikes.h5"

Expected:

- The spikes of "Populationhippocampus_neurons" are shown
