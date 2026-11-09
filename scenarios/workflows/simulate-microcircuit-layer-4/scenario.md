# Microcircuit simulation of layer 4

The "Microcircuit" workflow, under Simulate on the Workflows page, run on the
hexagonal column "nbS1-HEX0". The seed follows a scientist's demo of 2 September
2026: three neuron sets picked by layer and synapse class, a current clamp on
the layer 4 inhibitory neurons, and the soma voltage of the excitatory neurons
of layer 4 and of layers 2 and 3 recorded.

The campaign is generated and read, and never launched: the demo stops at the
launch button, and so does the seed. Generating a campaign costs nothing.

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

## Generate the layer 4 campaign without launching it

For each: configuration in the seed

Precondition:

1. The "Microcircuit" form is open, with the circuit the seed names chosen

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
- Its inputs are exactly the ones the seed names
- It has produced no outputs yet

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New simulation campaign"

Steps:

1. Open the simulations tab again

Expected:

- The launch button reads "Launch simulations"
