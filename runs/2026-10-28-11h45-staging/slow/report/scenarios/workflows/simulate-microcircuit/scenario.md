# Microcircuit simulation

The "Microcircuit" workflow, under Simulate on the Workflows page. obi-one
describes the form and the seed fills it in. The circuit is browsed for first;
everything else is chosen inside the form.

The seed drives 5,963 neurons with two somatic current clamps and records
nothing, so the only thing the run reports is spikes. Neuron sets, timestamps
and recordings are all left empty: the circuit's own defaults are what is under
test here.

A run takes about thirteen minutes and costs around 300 credits, so the case is
marked `slow` in the seed and belongs to the slow job rather than the nightly
suite. The seed gives it forty of those minutes, because one that has stalled
looks exactly like one that is still going and only the clock tells them apart.
The seed also says which deployments the workflow runs on, so no line here does.

User: credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Open "Simulate"
2. Start "Microcircuit"
3. Choose the circuit the seed names

Expected:

- "Generate simulation(s)" is disabled

## Generate a simulation campaign and launch it

For each: configuration in the seed

Precondition:

1. The "Microcircuit" form is open, with the circuit the seed names chosen

Steps:

1. Fill in the campaign name and description from the seed
2. Fill in the run's length, initial voltage, seed and calcium from the seed
3. Add each stimulus the seed names, with its own settings

Expected:

- "Generate simulation(s)" is enabled

Steps:

1. Press "Generate simulation(s)"

Expected:

- The simulations tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly: "Circuit directory", "node_sets.json",
  "obi_one_coordinate.json" and "simulation_config.json"
- It has produced no outputs yet

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New simulation campaign"

Steps:

1. Open the simulations tab again

Expected:

- The launch button reads "Launch simulations"

Steps:

1. Press "Launch simulations"

Expected:

- An estimated cost is shown, with a "Confirm" to press

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
- It reaches "done"
- Its inputs have gained "Task configuration"
- Its outputs are exactly: "Task logs" and "spikes.h5"
- The task log reads "Task execution completed."
