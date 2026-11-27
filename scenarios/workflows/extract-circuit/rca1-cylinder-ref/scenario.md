# Circuit extraction from rCA1-CYLINDER-REF

The "Circuit" workflow, under "Extract" on the Workflows page. It cuts a
sub-circuit out of the public circuit "rCA1-CYLINDER-REF". obi-one describes the
form, and the seed fills it in: one configuration per extraction target, each
an ID-based neuron set that the extraction then targets. The target has to be
chosen: left alone, the form extracts all biophysical neurons.

The seed names the circuit, the target, the cost the launch is estimated at,
and what the finished extraction registers. A circuit of one neuron is a
synaptome, a circuit of scale "single". It gets no connectivity matrix: obi-one
makes one only for a circuit of more than one neuron.

User: credits
Seed: seed.json

## The form will not launch until it is complete

The campaign name and description are what it waits for: once both are
filled in, it generates whichever neuron set is targeted, the default too.

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Extract" workflow for "Circuit", from the public circuit the seed names

Expected:

- "Generate extraction(s)" is disabled

## Generate an extraction campaign and launch it

For each: configuration in the seed

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Extract" workflow for "Circuit", from the public circuit the seed names
2. Add a "By ID (biophysical)" neuron set holding the IDs the seed names
3. Choose that neuron set as the "Neuron set" to extract
4. Fill in the campaign name and description from the seed

Expected:

- "Generate extraction(s)" is enabled

Steps:

1. Press "Generate extraction(s)"

Expected:

- The extractions tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New extraction campaign"

Steps:

1. Open the extractions tab again

Expected:

- The launch button reads "Launch extractions"

Steps:

1. Press "Launch extractions"

Expected:

- The estimated cost totals as many credits as the seed says

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
- It reaches "done"
- Its inputs are exactly the ones the seed names
- Its outputs are exactly the ones the seed names
- The task log reads "Task execution completed."
- The card of the circuit it registered reads as the seed says: scale "Single", 1 neuron
- "View details" on that card opens the circuit as a Synaptome, so it is of scale "single"

Steps:

1. Press the download button on the circuit's card

Expected:

- The download panel offers "Download full circuit", with the compressed circuit's size
