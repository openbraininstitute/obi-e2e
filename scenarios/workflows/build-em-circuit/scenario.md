# Electron microscopy circuit build

The Electron microscopy circuit build workflow, under Build on the Workflows
page. obi-one describes the form, and the seed fills it in, starting from a
morphology derived from an electron microscopy dense reconstruction dataset.

Those morphologies belong to a project rather than being public, so the browse
step opens the "Project" tab, picks the dataset first and the morphology under
it.

The seed names no deployment, so the workflow runs nowhere yet and this file is
skipped on staging and on production both. Naming a deployment in the seed is
what turns it on.

The seed says nothing about the files a finished coordinate holds, so the run is
only asked to have produced something.

Launching prices the build first: the estimate is shown and has to be confirmed
before anything starts.

User: credits
Seed: seed.json

## Generate a build campaign and launch it

For each: configuration in the seed

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Build" workflow for "Electron microscopy circuit"
2. Look at the project's own entities, and choose the dataset and the morphology the seed names
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
- The configuration it was generated from is among its inputs

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
- It has produced something
