# Paired neurons simulation

The film a scientist watches to learn the workflow: the Workflows page, the
Simulate category, the Paired neurons card, the circuit and its viewer, the
form, the campaign generated, launched and followed to its traces, and then
a tour of what the results offer — the input files, the recording's chart,
the spikes. One take, with time to see each page and what each click shows,
and a few words beside the things worth explaining.

Pace: 2 seconds
Size: 1920x1080
User: credits
Seed: seed.json

## The Workflows page

Steps:

1. Open the Workflows page of my project
2. Point at "Simulate": "Workflows are grouped by what they do. Simulate runs
   a model: one neuron, a pair, a microcircuit, a brain region."
3. Choose "Simulate"
4. Start "Paired neurons"

Show:

- The circuit listing, with the search box

## The circuit

Steps:

1. Search for the circuit the seed names and pick it
2. Press "Use model"

Show:

- The Paired neurons simulation form

## The circuit viewer

Steps:

1. Point at "Colour by": "The two neurons of the circuit, drawn from their
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

## The form, the campaign and the results

Steps:

1. Point at "Generate simulation(s)": "obi-one describes the form, section by
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

1. Point at the coordinate's status: "Each coordinate is one simulation. Its
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
4. Point at "Group by": "The soma voltage of each cell. Group by a property
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

A "Point at" line is a callout: a few words beside the element, shown for a
few seconds, then gone, before the next step.
