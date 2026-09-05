# Ion channel simulation

The Ion channel simulation workflow, under Simulate on the Workflows page.
obi-one describes the form, and the seed fills it in, following obi-one's own
ion channel example: the channel given a conductance, held at three voltages in
turn, and recorded.

Unlike the other workflows, this one browses for nothing first. It opens straight
into the form, and the ion channel model is picked from a field inside it while
the rest is filled.

The seed also says which deployments the workflow runs on, so no line here does.

Launching prices the simulation first: the estimate is shown and has to be
confirmed before anything starts.

User: lab member, spending credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Simulate" workflow for "Ion channel"

Expected:

- The form opens, with nothing to browse for first
- "Generate simulation(s)" is disabled

## Generate a simulation campaign and launch it

For each: configuration in the seed

Precondition:

1. The Ion channel simulation form is open

Steps:

1. Fill the form from the configuration in the seed, the ion channel model included

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

- The spikes of "PopulationAll" are shown
