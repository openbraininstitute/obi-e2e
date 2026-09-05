# Synaptome build

The Synaptome build workflow, under Build on the Workflows page.
obi-one describes the form; the seed fills it in.

User: lab member, spending credits
Seed: seed.json

## The form is not launchable until it is complete

Steps:
1. Start the "Build" workflow for "Synaptome"
2. Choose the ME-model the seed names

Expected:
- "Generate build(s)" is disabled

## Generate a build campaign

After: The form is not launchable until it is complete
For each: configuration in the seed

Steps:
1. Fill the form from the seed
2. Press "Generate build(s)"

Expected:
- The "Results" tab is open
- The number of coordinates is what the seed says
- Its inputs are exactly:
    "obi_one_coordinate.json"

## Launch it and read what came out

After: Generate a build campaign

Steps:
1. Press "Launch builds"
2. Confirm the cost

Expected:
- The coordinate becomes "done" (within 5 minutes)
- Its outputs are exactly:
    "Task logs" and the synaptome, named after the campaign

Steps:
1. Open "Task logs"

Expected:
- The log shows "completed"

## Look at the morphology another way

After: The form is not launchable until it is complete
User: lab member

Steps:
1. Switch to the dendrogram

Expected:
- The dendrogram is open
- The 3D view is closed
