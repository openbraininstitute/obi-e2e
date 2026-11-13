# Single neuron simulation

The Single neuron simulation workflow, under Simulate on the Workflows page.
obi-one describes the form, and the seed fills it in.

The seed holds two configurations, and each one becomes a test of its own. One
clamps the soma once; the other gives the same clamp two amplitudes, so the
campaign comes out as a grid of two coordinates. The seed also says which
deployments the workflow runs on, so no line here does.

Launching prices the simulation first: the estimate is shown and has to be
confirmed before anything starts.

A finished run opens on its Task Log. Its spike file reads as the bare file,
"spikes", until it has been opened once; then it reads as its population,
"All". An ME-model has no circuit to name it from before that.

User: credits
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

- The simulations tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly:
  "Node sets", "OBI-ONE Config" and "SONATA Simulation Config"
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
- The coordinate reaches "done" (within 15 minutes)

Steps:

1. Open the spikes file

Expected:

- Its inputs have gained "Launch Config"
- Its outputs are exactly: "Task Log", "Recording 0" and "All", the spikes of the one population

Steps:

1. Open "Recording 0"

Expected:

- The trace is drawn against "Time (ms)" and "Voltage (mV)"

Steps:

1. Open "All"

Expected:

- The spikes of "PopulationAll" are shown
