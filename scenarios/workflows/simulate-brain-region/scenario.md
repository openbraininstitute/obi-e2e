# Brain region simulation

The Brain region simulation workflow, under Simulate on the Workflows page.
obi-one describes the form, and the seed fills it in, following obi-one's own
circuit simulation example: a neuron set, a clamp on it, and a recording of it.

The workflow sits behind a feature flag, which the seed names. The flag is set
before the page loads, because the hub renders the card disabled otherwise.

A whole region takes far longer to simulate than a browser test can sit
through, so the campaign is only asked to start. The seed names no files, and
nothing here says what the run produces, because nobody has watched one finish.

The seed also says which deployments the workflow runs on, so no line here does.

Launching prices the simulation first: the estimate is shown and has to be
confirmed before anything starts.

User: lab member, spending credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. The feature the seed names is turned on
2. Inside my project, on the Workflows page

Steps:

1. Start the "Simulate" workflow for "Brain region"
2. Choose the circuit the seed names

Expected:

- "Generate simulation(s)" is disabled

## Generate a simulation campaign and launch it

For each: configuration in the seed

Precondition:

1. The feature the seed names is turned on
2. The Brain region simulation form is open, with the circuit the seed names
   chosen

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
