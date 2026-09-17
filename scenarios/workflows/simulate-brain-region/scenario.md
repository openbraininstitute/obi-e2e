# Brain region simulation

The Brain region simulation workflow, under Simulate on the Workflows page.
obi-one describes the form, and the seed fills it in, following obi-one's own
circuit simulation example: a neuron set, a clamp on it, and a recording of it.

The scenario is on hold, and the spec says so at the top. Its case is marked
`slow` in the seed, so it belongs to the slow job rather than the nightly suite;
the skip comes off when someone asks for the workflow back. The steps below are
still current and nothing here needs rewriting.

The workflow sits behind a feature flag, which the seed names. The flag is set
before the page loads, because the hub renders the card disabled otherwise.

A whole region is priced past two hundred thousand credits a run, several times
what the virtual lab holds, so no run of it can be started here at all. This
scenario covers the form and the generated campaign and stops with the launch
button offered but unpressed. Nothing here says what a run produces, because
none is started.

The seed says so too, with `launch: false` on the configuration. It also says
which deployments the workflow runs on, so no line here does.

User: credits
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

## Generate a simulation campaign without launching it

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

Expected:

- The launch button still reads "Launch simulations", and is left unpressed
