# Paired neurons simulation

This video shows how to run a paired neurons simulation from start to end.
We go to the Workflows page, pick Simulate, then Paired neurons, choose the
circuit and play a bit with the viewer. Then we fill the form, generate the
simulation, launch it and wait for the results. At the end we look around:
the input files, the voltage traces and the spikes. All in one take, slow
enough to follow every click, with small popups to explain the important parts.

Pace: 2 seconds
Size: 1920x1080
User: credits
Seed: seed.json

## The Workflows page

Steps:

1. Open the Workflows page of my project
2. Point at "Simulate" as "Workflows": "Workflows are grouped by what they do. Simulate runs
   a model: one neuron, a pair, a microcircuit, a brain region."
3. Choose "Simulate"
4. Start "Paired neurons"

Show:

- The circuit listing, with the search box

## The circuit

Steps:

1. Focus on the search box
2. Search for the circuit the seed names
3. Pull back
4. Focus on the circuit's row
5. Pick it
6. Pull back
7. Press "Use model"

Show:

- The circuit's row, found by its name
- The Paired neurons simulation form

## The circuit viewer

Steps:

1. Point at "Colour by" as "The circuit viewer": "The two neurons of the circuit, drawn from their
   morphologies. Colour them by any property, show the other populations,
   pick a node in the table."
2. Colour the cells by "Mtype"
3. Open the "Populations" menu, then close it
4. Open the viewer settings, then close them
5. Pick the first node in the table, then let it go

Show:

- "Colour by" reads "Mtype"
- The populations menu lists what can be shown
- The settings offer the "Zoom slider"
- "Nodes: 1/2 selected", then "Nodes: 0/2 selected"

## The form, up close

Steps:

1. Focus on "Info"
2. Open "Info"
3. Focus on "Campaign name"
4. Focus on "Campaign description"
5. Focus on "Initialization"
6. Open "Initialization"
7. Focus on "Simulation length"
8. Focus on "Timestamps"
9. Pull back

Show:

- The camera goes from each to the next without returning to the whole screen
- "Campaign name" and "Campaign description" under Info; "Simulation length"
  under Initialization

## The form, the campaign and the results

Steps:

1. Point at "Generate simulation(s)" as "The form": "obi-one describes the form, section by
   section. The button enables once every section is complete."
2. Fill the form from the configuration in the seed
3. Press "Generate simulation(s)"
4. Go back to the configuration tab, then to the simulations tab
5. Press "Launch simulations", then "Confirm"
6. Open "Recording 0", then "S1nonbarrel_neurons"

Show:

- One coordinate, read "created", then leaving it
- The coordinate reaching "done", with "Recording 0" and
  "S1nonbarrel_neurons" among its outputs
- The traces of "2 cells recorded"; the spikes of "PopulationS1nonbarrel_neurons"

## The input files

Steps:

1. Point at the coordinate's status as "The campaign": "Each coordinate is one simulation. Its
   status goes from created to running to done, and its files arrive as it
   runs."
2. Open "Node sets"
3. Open "OBI-ONE Config"

Show:

- The node sets JSON, with "Mosaic"
- The obi-one configuration JSON, with "obi_one_version"

## The recording

Steps:

1. Open "Recording 0"
2. Group the traces by "mtype"
3. Pick the first cell in the table
4. Point at "Group by" as "The recording": "The soma voltage of each cell. Group by a property
   to compare classes; pick a row to see one cell alone."

Show:

- "cells recorded" above the chart
- "Group by" reads "mtype"
- "Nodes: 1/2 selected"

## The spikes

Steps:

1. Open "S1nonbarrel_neurons"
2. Order the cells by "Firing rate (Hz)"
3. Press "Spiking"

Show:

- "Order by" reads "Firing rate"
- "Spiking" pressed, and "N of N spikes" counted
- The raster, held for one pace at the end

A "Point at" line is a callout: a panel beside the element, with an arrow to
it, headed by the title after "as" and holding the words, shown for a few
seconds, then gone, before the next step.

"Focus on" moves the camera in on an element, with room around it, scrolling
it into view first; one "Focus on" after another is one move flowing into the
next. "Pull back" returns to the whole screen. "Scroll to" brings an element
into view where the camera is. The steps between happen where the camera is.
