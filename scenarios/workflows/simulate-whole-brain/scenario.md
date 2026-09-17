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
through, and costs more than a nightly suite should spend on one workflow. The
obi-one generation path for this circuit is still under improvement, so this
scenario covers the configured form only and does not submit generation. Nothing
here says what a run produces, because none is generated or started.

The scenario is on hold, and the spec says so at the top. Its case is marked
`slow` in the seed, so it belongs to the slow job rather than the nightly suite;
the skip comes off when someone asks for the workflow back. The steps below are
still current and nothing here needs rewriting.

The seed also says which deployments the workflow runs on, so no line here does.

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

## Configure a whole brain simulation without generating it

For each: configuration in the seed

Precondition:

1. The Whole brain simulation form is open, with the circuit the seed names chosen

Steps:

1. Fill the form from the configuration in the seed

Expected:

- The button reads "Generate simulation(s)"
- The button is enabled
- No generation request is sent
