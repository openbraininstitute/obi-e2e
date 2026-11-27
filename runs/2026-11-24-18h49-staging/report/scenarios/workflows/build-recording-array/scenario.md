# Extracellular recording array build

The Extracellular recording array build workflow, under Build on the Workflows
page. obi-one describes the form, and the seed fills it in, placing one probe
over a circuit.

The workflow sits behind a feature flag, which the seed names. The flag is set
before the page loads, because the hub renders the card disabled otherwise.

The seed says what a coordinate holds the moment it is generated, and what the
finished one holds: the probe's weights, its electrode locations, a picture of
the array, and the array obi-one registers. That array is named after the
circuit's id rather than its name, and the id differs on every deployment, so
the seed names it by its start.

The seed also says which deployments the workflow runs on, so no line here does.

Launching prices the build first: the estimate is shown and has to be confirmed
before anything starts.

User: credits
Seed: seed.json

## Generate a build campaign and launch it

For each: configuration in the seed

Precondition:

1. The feature the seed names is turned on
2. Inside my project, on the Workflows page

Steps:

1. Start the "Build" workflow for "Extracellular recording array"
2. Choose the circuit the seed names
3. Fill the form from the configuration in the seed

Expected:

- The button reads "Generate build(s)"
- The button is enabled

Steps:

1. Press "Generate build(s)"

Expected:

- The results tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly: "OBI-ONE Config"
- It has produced no outputs yet

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New build campaign"

Steps:

1. Open the results tab again
2. Press "Launch builds"

Expected:

- An estimated cost breakdown is shown, with a "Confirm" to press

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
- The coordinate reaches "done" (within 6 minutes)
- Its inputs are exactly: "Launch Config", "OBI-ONE Config"
- Its outputs are exactly: "Task Log", the recording array, "weights.h5", "electrode_locations.json", "electrode_array.png"
