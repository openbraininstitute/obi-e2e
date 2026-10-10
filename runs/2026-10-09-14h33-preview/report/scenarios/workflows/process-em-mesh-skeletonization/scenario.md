# EM mesh skeletonization

The EM mesh skeletonization workflow, under Process data on the Workflows page.
obi-one describes the form, and the seed fills it in: the mesh is ticked in the
browse table and arrives in the form already chosen, so the seed sets only the
campaign details, the two voxel sizes and the spine option.

The mesh is public rather than the project's own, so the browse step opens the
"Public" tab and ticks the row there.

Both voxel sizes are in micrometres, and the seed writes them in rather than
leaving obi-one's own defaults. The raw spine meshes are turned off, so the run
does not carry them as well.

One mesh at this resolution reconstructs in about five minutes, so the test
follows the run to the end and reads the morphology it registered.

The seed also says which deployments the workflow runs on, so no line here does.

Launching prices the reconstruction first: the estimate is shown and has to be
confirmed before anything starts.

User: credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Process data" workflow for "EM mesh skeletonization"
2. Choose the mesh the seed names

Expected:

- "Generate skeletonization(s)" is disabled

## Generate a skeletonization campaign and launch it

For each: configuration in the seed

Precondition:

1. The EM mesh skeletonization form is open, with the mesh the seed names chosen

Steps:

1. Fill the form from the configuration in the seed

Expected:

- The button reads "Generate skeletonization(s)"
- The button is enabled

Steps:

1. Press "Generate skeletonization(s)"

Expected:

- The skeletonizations tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly: "obi_one_coordinate.json"
- It has produced no outputs yet
- The launch button reads "Launch skeletonizations"

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New skeletonization campaign"

Steps:

1. Open the skeletonizations tab again
2. Press "Launch skeletonizations"

Expected:

- An estimated cost breakdown is shown, with a "Confirm" to press

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
- The coordinate reaches "done"
- Its inputs are exactly: "Task configuration" and "obi_one_coordinate.json"
- Its outputs are exactly: "Task logs" and "Skeletonized morphology"

Steps:

1. Open "Task logs"

Expected:

- The log reads "Task execution completed."
- No entity card sits beside the log

Steps:

1. Open the skeletonized morphology the run produced

Expected:

- It offers a download and a way to view its details
- Its properties read as the seed says, such as "Brain Region"
