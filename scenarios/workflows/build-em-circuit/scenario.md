# Electron microscopy circuit build

The Electron microscopy circuit build workflow, under Build on the Workflows
page. obi-one describes the form, and the seed fills it in, starting from a
morphology derived from an electron microscopy dense reconstruction dataset.

No deployment holds such a morphology, public or otherwise: one is registered
by the EM mesh skeletonization workflow, which derives it from the dataset. So
the test first skeletonizes the MICrONS mesh the second seed names, into the
project, and only then starts the build. The browse step opens the "Project"
tab, picks the dataset first and the morphology under it: obi-one names the
morphology after the mesh's id and describes it by the neuron's, which is what
the seed searches for.

The seed names no deployment, so the workflow runs nowhere yet and this file is
skipped on staging and on production both. On 27 Oct 2026 the chain got as far
as the build's browse step: the skeletonization of the MICrONS mesh took about
nine minutes and 900 credits, more than a nightly project can spare, and the
morphology it registered was not offered under the dataset afterwards. Naming
a deployment in the seed is what turns it on, once the data is there.

Launching prices the build first: the estimate is shown and has to be confirmed
before anything starts.

User: credits
Seed: seed.json

## Generate a build campaign and launch it

For each: configuration in the seed

Precondition:

1. Inside my project, on the Workflows page
2. The EM mesh skeletonization in skeletonization.json has run to "done", so the project holds the morphology

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
