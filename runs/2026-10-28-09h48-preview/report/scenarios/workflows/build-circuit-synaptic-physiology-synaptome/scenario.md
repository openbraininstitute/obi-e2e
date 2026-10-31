# Circuit synaptic physiology build of a synaptome

The Circuit synaptic physiology workflow, under Build on the Workflows page, run
on a circuit with more synapses than the neuron pair: the synaptome
"nbS1-O1__202247__cADpyr__L5_TPC_A", one L5 TPC with its 4850 synapses from
POm, VPM and external inputs. The one configuration in the seed gives the POm and VPM synapses an
inhibitory Tsodyks-Markram model, with all the virtual neurons as their source,
and leaves the external synapses on the form's default excitatory model.

The seed holds only what the form holds. Every distribution, and the default
excitatory model, is left at the form's default, and obi-one fills them in when
it generates the campaign. The seed names staging only, so no line here does.

User: credits
Seed: seed.json

## Generate a build campaign and launch it

For each: configuration in the seed

Precondition:

1. The Circuit synaptic physiology form is open, with the circuit the seed names chosen

Steps:

1. Fill the form from the configuration in the seed

Expected:

- The button reads "Generate build(s)"
- The button is enabled

Steps:

1. Press "Generate build(s)"

Expected:

- The results tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly: "obi_one_coordinate.json"
- It has produced no outputs yet
- The launch button reads "Launch builds"

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
- The coordinate reaches "done" (within 5 minutes)
- Its inputs are exactly: "Task configuration", "obi_one_coordinate.json" and
  "Circuit directory"
- Its outputs are exactly: "Task logs" and the circuit the build registered,
  "nbS1-O1__202247__cADpyr__L5_TPC_A (synapse-parameterized)"

Steps:

1. Open "Task logs"

Expected:

- The log reads "Task execution completed."
- No entity card sits beside the log

Steps:

1. Open the circuit the build registered

Expected:

- It offers a download and a way to view its details
- Its properties read as the seed says: still a "Single" of "1" neuron
