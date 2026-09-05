# Single neuron simulation

The Single neuron simulation workflow, under Simulate on the Workflows page.
obi-one describes the form, and the seed fills it in.

The seed holds two configurations, and each one becomes a test of its own. One
clamps the soma once; the other gives the same clamp two amplitudes, so the
campaign comes out as a grid of two coordinates. The seed also says which
deployments the workflow runs on, so no line here does.

An ME-model campaign has no cost estimator behind it, so launching starts the
simulation straight away rather than asking what it will cost first.

User: lab member, spending credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Simulate" workflow for "Single neuron"
2. Choose the ME-model the seed names

Expected:

- "Generate simulation(s)" is disabled

## Generate a simulation campaign and launch it

Both configurations produce the same two files, so both are read the same way.

For each: configuration in the seed

Precondition:

1. The Single neuron simulation form is open, with the ME-model the seed names chosen

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
- Its inputs are exactly:
  "node_sets.json", "obi_one_coordinate.json" and "simulation_config.json"
- It has produced no outputs yet
- The launch button reads "Launch simulations"

Steps:

1. Press "Launch simulations"

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

- The spikes of "PopulationAll" are shown
