# Whole brain simulation of the male CNS

The Whole brain simulation workflow, under Simulate on the Workflows page, run
on "MaleCNS-v1.0-Brian2-LIF-v1": the point-neuron model of the whole central
nervous system of an adult male fruit fly, run on the Brian2 simulator. The
path follows the FlyWire demo of 4 November 2026 (PMO-764): pheromone taste
neurons on the front leg are driven, and the courtship neurons are recorded.

The seed builds two neuron sets by neuron property. "Front leg ppk23" holds
the ppk23 taste neurons that enter through the prothoracic leg nerve
(receptor_type putative_ppk23, entry_nerve ProLN). "fru dsx" holds the neurons
that express both fruitless and doublesex at a low level (fru_dsx
coexpress_low). A sinusoidal current clamp drives the first set, and the soma
voltage of the second is recorded for the whole run.

The clamp's maximum amplitude is scanned over three values, so one campaign
holds three simulations. Each one finished in under two minutes in the demo.

The seed also says which deployments the workflow runs on, so no line here does.

Launching prices the simulation first: the estimate is shown and has to be
confirmed before anything starts.

User: credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Simulate" workflow for "Whole brain"
2. Choose the circuit the seed names

Expected:

- "Generate simulation(s)" is disabled

## Drive the front leg taste neurons and record the courtship neurons

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
- There are as many simulations as the seed says, one per amplitude
- The first simulation reads "created"
- Its inputs are exactly the ones the seed names
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

- The first simulation leaves "created"
- It reaches "done" (within 10 minutes)
- Its outputs are exactly: "Task Log", "Recording 0" and "drosophila", the
  spikes of the one population
- The task log ends with "Task execution completed."

Steps:

1. Open "Recording 0"

Expected:

- The soma voltage of the recorded cells is drawn against "Time (ms)" and
  "Voltage (mV)"

Steps:

1. Open "drosophila"

Expected:

- The spikes of the "drosophila" population are shown
