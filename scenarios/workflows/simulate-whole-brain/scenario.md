# Whole brain simulation

The Whole brain simulation workflow, under Simulate on the Workflows page.
obi-one describes the form, and the seed fills it in: a neuron set, and a
Poisson drive on it.

The circuit is a FlyWire fly connectome of point neurons, run on the Brian2
simulator. The form carries no timestamps and no recordings, so the seed sets
only the campaign details, the neuron sets, the drive and the initialisation.

The drive follows obi-one's own reference for this circuit,
`projects/drosophila/brian2_simulation_from_sonata.ipynb`: it lands on the
`sugar` node set the circuit already carries — the twenty-one sugar-sensing
neurons — and not on the whole connectome. Direct Poisson Input is capped at a
hundred neurons, so a drive on every point neuron is refused when the campaign
is generated.

A whole brain takes hours to simulate, far longer than a browser test can sit
through, and costs more than a nightly suite should spend on one workflow. So
this scenario covers the form and the generated campaign and stops with the
launch button offered but unpressed. Nothing here says what a run produces,
because none is started.

The seed says so too, with `launch: false` on the configuration. It also says
which deployments the workflow runs on, so no line here does.

User: lab member, spending credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Simulate" workflow for "Whole brain"
2. Choose the circuit the seed names

Expected:

- "Generate simulation(s)" is disabled

## Generate a simulation campaign without launching it

For each: configuration in the seed

Precondition:

1. The Whole brain simulation form is open, with the circuit the seed names chosen

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
