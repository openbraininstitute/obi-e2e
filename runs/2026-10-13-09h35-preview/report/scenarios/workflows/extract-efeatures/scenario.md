# Intracellular e-feature extraction

The "Intracellular EFeatures" workflow, under Extract on the Workflows page.
obi-one describes the form and the seed fills it in. Nothing is browsed for
first: the recording is chosen inside the form.

The seed names that recording by id, because two public recordings share the
name "C190101A1-MT-C1" and hold different protocols. Which protocols the form
offers, and the amplitudes each was measured at, are read from the recording it
names. The features come with the protocol; the seed only says how many.

The workflow sits behind a feature flag, which the seed names. The flag is set
before the page loads, because the hub renders the card disabled otherwise. The
seed also says which deployments the workflow runs on, so no line here does.

User: credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. The feature the seed names is turned on
2. Inside my project, on the Workflows page

Steps:

1. Open "Extract"
2. Start "Intracellular EFeatures"

Expected:

- The form opens, with nothing to browse for first
- "Generate extraction(s)" is disabled

## Generate an extraction campaign and launch it

For each: configuration in the seed

Precondition:

1. The feature the seed names is turned on
2. The "Intracellular EFeatures" form is open

Steps:

1. Fill in the campaign name and description from the seed
2. Choose the recording the seed names
3. Tick each protocol the seed names, at the amplitudes it names
4. Fill in the settings from the seed

Expected:

- Each protocol carries as many features as the seed says
- "Generate extraction(s)" is enabled

Steps:

1. Press "Generate extraction(s)"

Expected:

- The extractions tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly: "obi_one_coordinate.json"
- It has produced no outputs yet

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

- An estimated cost is shown, with a "Confirm" to press

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
- It reaches "done"
- Its inputs are exactly: "Task configuration", "obi_one_coordinate.json"
- Its outputs are exactly: "Task logs", "extracted_features.json", "figures"
- The task log reads "Task execution completed."
