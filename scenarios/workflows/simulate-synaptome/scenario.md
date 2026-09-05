# Synaptome simulation

The Synaptome simulation workflow, under Simulate on the Workflows page. obi-one
describes the form, and the seed fills it in, following obi-one's own
ME-model-with-synapses example: spikes drawn from an exponential interval, plus
a somatic clamp.

The spikes the stimulus will play are generated with the campaign, so they sit
among the inputs as a file of their own before anything runs.

The seed also says which deployments the workflow runs on, so no line here does.

Launching prices the simulation first: the estimate is shown and has to be
confirmed before anything starts.

User: lab member, spending credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Simulate" workflow for "Synaptome"
2. Choose the synaptome the seed names

Expected:

- "Generate simulation(s)" is disabled

## Generate a simulation campaign and launch it

For each: configuration in the seed

Precondition:

1. The Synaptome simulation form is open, with the synaptome the seed names chosen

Steps:

1. Fill the form from the configuration in the seed

Expected:

- The button reads "Generate simulation(s)"
- The button is enabled

Steps:

1. Press "Generate simulation(s)"

Expected:

- The simulations tab is enabled
- The button now reads "New simulation campaign"

Steps:

1. Open the simulations tab

Expected:

- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs hold the stimulus spikes, "Stimulus 0_spikes.h5", beside
  "circuit_config.json", "node_sets.json", "obi_one_coordinate.json" and
  "simulation_config.json"
- It has produced no outputs yet
- The launch button reads "Launch simulations"

Steps:

1. Press "Launch simulations"

Expected:

- An estimated cost breakdown is shown, with a "Confirm" to press

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
- The coordinate reaches "done" (within 5 minutes)
- Its outputs are exactly: "Recording 0.h5" and "spikes.h5"

Steps:

1. Open "Recording 0.h5"

Expected:

- The trace is drawn against "Time (ms)" and "Voltage (mV)"

Steps:

1. Open "spikes.h5"

Expected:

- The spikes of "PopulationS1nonbarrel_neurons" are shown
