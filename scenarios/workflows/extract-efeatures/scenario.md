# Intracellular e-feature extraction

The Intracellular EFeatures workflow, under Extract on the Workflows page.
obi-one describes the form, and the seed fills it in: one intracellular
recording, and one protocol whose features are taken from it.

This workflow browses for nothing first. The card opens the form straight away,
and the recording is chosen inside the Inputs block rather than on a browse page.

Which protocols the form offers is read from the chosen recording. A recording
that stops holding "GenericStep" fails here instead of extracting nothing.

The workflow sits behind a feature flag, which the seed names. The flag is set
before the page loads, because the hub renders the card disabled otherwise.

The run itself is not followed. obi-one refuses every extraction this
deployment can configure: no electrical cell recording it holds reports any step
amplitudes, so the protocol card is ticked with an empty amplitude list and the
run stops with "either targets or autotargets should be set". Until a recording
with amplitudes exists, or the form stops accepting a protocol without them, the
campaign can only be asked to start.

The seed also says which deployments the workflow runs on, so no line here does.

Launching prices the extraction first: the estimate is shown and has to be
confirmed before anything starts.

User: lab member, spending credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. The feature the seed names is turned on
2. Inside my project, on the Workflows page

Steps:

1. Start the "Extract" workflow for "Intracellular EFeatures"

Expected:

- The form opens, with nothing to browse for first
- "Generate extraction(s)" is disabled

## Generate an extraction campaign and launch it

For each: configuration in the seed

Precondition:

1. The feature the seed names is turned on
2. The Intracellular EFeatures form is open

Steps:

1. Fill the form from the configuration in the seed, the recording and the
   protocol included

Expected:

- The button reads "Generate extraction(s)"
- The button is enabled

Steps:

1. Press "Generate extraction(s)"

Expected:

- The extractions tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly: "obi_one_coordinate.json"
- It has produced no outputs yet
- The launch button reads "Launch extractions"

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New extraction campaign"

Steps:

1. Open the extractions tab again
2. Press "Launch extractions"

Expected:

- An estimated cost breakdown is shown, with a "Confirm" to press

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
