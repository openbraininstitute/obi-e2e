# Microcircuit simulation

The Microcircuit simulation workflow, under Simulate on the Workflows page.
obi-one describes the form, and the seed fills it in, following obi-one's own
circuit simulation example: a neuron set, a clamp on it, and a recording of it.

A microcircuit is priced at roughly 2,300 credits a run, more than a nightly
suite should spend on one workflow. So this scenario covers the form and the
generated campaign and stops with the launch button offered but unpressed.
Nothing here says what a run produces, because none is started.

The seed says so too, with `launch: false` on the configuration. It also says
which deployments the workflow runs on, so no line here does.

User: credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Simulate" workflow for "Microcircuit"
2. Choose the circuit the seed names

Expected:

- "Generate simulation(s)" is disabled

## Generate a simulation campaign without launching it

For each: configuration in the seed

Precondition:

1. The Microcircuit simulation form is open, with the circuit the seed names chosen

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
- Its inputs are exactly: "Circuit directory", "node_sets.json",
  "obi_one_coordinate.json" and "simulation_config.json"
- It has produced no outputs yet
- The launch button reads "Launch simulations"

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New simulation campaign"

Steps:

1. Open the simulations tab again

Expected:

- The launch button still reads "Launch simulations", and is left unpressed
