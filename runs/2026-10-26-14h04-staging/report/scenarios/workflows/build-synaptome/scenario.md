# Synaptome build

The Synaptome build workflow, under Build on the Workflows page. obi-one
describes the form, and the seed fills it in.

The seed holds two configurations, and each one becomes a test of its own. One
fills the form through its fields; the other places its synapses by clicking the
morphology in the 3D viewer. The seed also says which deployments the workflow
runs on, so no line here does.

User: credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Start the "Build" workflow for "Synaptome"
2. Choose the ME-model the seed names

Expected:

- "Generate build(s)" is disabled

## A project with no credits can still generate a campaign

This one uses the first configuration in the seed only.

Precondition:

1. The Synaptome build form is open, with the ME-model the seed names chosen
2. The project has no credits

Expected:

- The generate button is showing

Steps:

1. Fill the form from the first configuration in the seed

Expected:

- The button reads "Generate build(s)"
- The button is enabled

Steps:

1. Press "Generate build(s)"

Expected:

- No notice about credits appears
- The results tab is open to be read
- The button now reads "New build campaign", so the campaign was made

## Generate a build campaign and launch it

Where the seed names the entity a finished build should hold, that entity is
opened and read. Where it names none, the run only has to produce something.

For each: configuration in the seed

Precondition:

1. The Synaptome build form is open, with the ME-model the seed names chosen
2. The project has credits

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
- Its inputs are exactly:
  "Task configuration", "obi_one_coordinate.json" and "Circuit directory"
- Its outputs are exactly:
  "Task logs" and the synaptome named after the campaign

Steps:

1. Open "Task logs"

Expected:

- The log reads "Task execution completed."
- No entity card sits beside the log

Steps:

1. Open the synaptome the build produced

Expected:

- It is named after the campaign
- It offers a download and a way to view its details
- Its properties read as the seed says, such as "Number of synapses"

## Clicking a neurite adds a location

Precondition:

1. The Synaptome build form is open, with the ME-model the seed names chosen
2. An "Explicit Morphology Locations" placement strategy has been added, so its panel is showing

Expected:

- The list of locations is empty

Steps:

1. Click two neurites in the 3D viewer

Expected:

- Two locations are in the list
- The first location has a section id
- The first location's section id cannot be typed over
- The first location's offset can be changed

## An offset stays inside its section

Precondition:

1. An "Explicit Morphology Locations" placement strategy has been added, so its panel is showing
2. One location has been picked in the 3D viewer

Steps:

1. Set the offset to "0.5" and leave the field

Expected:

- The offset reads "0.50"

Steps:

1. Set the offset to "1.4" and leave the field

Expected:

- The offset reads "1.00"

Steps:

1. Set the offset to "-0.3" and leave the field

Expected:

- The offset reads "0.00"

## A synapse group keeps its last location

Precondition:

1. An "Explicit Morphology Locations" placement strategy has been added, so its panel is showing
2. Two locations have been picked in the 3D viewer

Steps:

1. Remove the first location

Expected:

- One location is left
- The last location offers no way to remove it

## Look at the morphology as a dendrogram and back

Precondition:

1. The Synaptome build form is open, with the 3D scene showing

Expected:

- The 3D visualization is the mode in use
- The dendrogram is not the mode in use

Steps:

1. Switch to the dendrogram

Expected:

- The dendrogram is the mode in use
- The 3D visualization is no longer the mode in use

Steps:

1. Switch back to the 3D visualization

Expected:

- The 3D visualization is the mode in use again

## Turn the axon on and off

Precondition:

1. The Synaptome build form is open, with the 3D scene showing

Steps:

1. Open the viewer settings

Expected:

- The axon toggle is showing
- The axon toggle is off

Steps:

1. Turn the axon on

Expected:

- The axon toggle is on

Steps:

1. Turn the axon off again

Expected:

- The axon toggle is off again

## Add a zoom slider to the viewer

Precondition:

1. The Synaptome build form is open, with the 3D scene showing

Expected:

- There is no zoom slider on the scene

Steps:

1. Open the viewer settings

Expected:

- The zoom slider toggle is off

Steps:

1. Turn the zoom slider on

Expected:

- The zoom slider toggle is on
- The zoom slider is on the scene

Steps:

1. Turn the zoom slider off

Expected:

- The zoom slider is gone from the scene

## The viewer opens with a scale bar and a solid neuron

Precondition:

1. The Synaptome build form is open, with the 3D scene showing

Steps:

1. Open the viewer settings

Expected:

- The scale bar toggle is on
- The neuron opacity reads "100%"
