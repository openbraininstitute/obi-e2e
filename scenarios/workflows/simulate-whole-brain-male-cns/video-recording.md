# Whole brain simulation of the male CNS

We simulate the whole fly nervous system: we poke the taste neurons on the
front leg and watch what the courtship neurons do. Same path as the FlyWire
demo, in one take.

The demo had the "circuit-morphologies" feature flag on, so the film turns it
on too.

Pace: 2 seconds
User: credits
Seed: seed.json

## The fly circuits

Steps:

1. Open the circuit list on the Data page
2. Search for the circuit the seed names
3. Open its card
4. Point at the card as "The circuit": "The male fly CNS. 164,606 neurons and
   about 25 million synapses."

Show:

- The circuit in the list
- Its card, with the number of neurons

## The Workflows page

Steps:

1. Open the Workflows page
2. Point at "Simulate" as "Workflows": "Simulate runs a model. Whole brain is
   the one for a full connectome."
3. Pick "Simulate"
4. Start "Whole brain"

Show:

- The circuit list, with the search box

## Picking the circuit

Steps:

1. Focus on the search box
2. Search for the circuit the seed names
3. Pull back
4. Focus on the circuit's row
5. Pick it
6. Pull back
7. Press "Use model"

Show:

- The circuit's row
- The form

## The circuit viewer

Steps:

1. Point at "Colour by" as "The viewer": "Every neuron of the fly. Colour them
   by anything the connectome knows about them."
2. Colour by "Synapse Class", then "Cell Sub Class", then "Cell Type"
3. Open the viewer settings, then close them
4. In the table, keep only "Entry nerve" ProLN
5. Then only "Receptor type" putative_ppk23
6. Select all the rows the table shows
7. Press "Show every neuron again"
8. Keep only "Fru dsx" coexpress_low
9. Press "Show every neuron again"

Show:

- "Colour by" reads "Cell Type"
- The settings have "Morphologies"
- "989 of 164,606 neurons selected", then "71 of 164,606 neurons selected"
- "Nodes: 71/164,606 selected"
- "65 of 164,606 neurons selected"
- All the neurons back

## Filling the form, and running the simulations

Steps:

1. Point at "Generate simulation(s)" as "The form": "Two groups of neurons:
   the ppk23 taste neurons of the front leg, and the fru dsx courtship
   neurons. We poke the first at 1, 2 and 8 nA and record the second."
2. Fill the form from the configuration in the seed
3. Rename the neuron sets "front leg ppk 23" and "fru dsx", and the stimulus
   "Front leg sine"
4. Press "Generate simulation(s)"
5. Go back to the configuration tab, then to the simulations tab
6. Press "Launch simulations", then "Confirm"
7. Wait for the first simulation to finish
8. Open "Recording 0", then "drosophila"

Show:

- The new names in the form
- Three simulations, "created", then running
- The first one "done", with "Task Log", "Recording 0" and "drosophila"
- The voltage traces, then the spikes

## The spikes

Steps:

1. Point at the simulation's status as "The simulations": "One simulation per
   amplitude. Each one runs the whole fly for one second, in about a minute
   and a half."
2. Open "drosophila"
3. Zoom into a time window on the raster, then back out to the whole run
4. Order by "cell_class", then back to "Node id"
5. Press "Spiking"
6. Tick two cells in the table, then untick them
7. Order by "Firing rate (Hz)"
8. Look at the details of the "Front leg sine" stimulus

Show:

- The zoom window, then the whole run again
- "Order by" reads "cell_class", then "Node id"
- Only the cells that fired, "N of N spikes"
- "Nodes: 2/" selected, then "Nodes: 0/"
- "Order by" reads "Firing rate"
- The stimulus details

## The 3D player

Steps:

1. Point at "3D Player · Statistics" as "The 3D player": "The spikes played
   back on the neurons, with the firing rate next to them."
2. Press "All", then "3D Player · Statistics"
3. Press play
4. Give the 3D player the whole page
5. Open the viewer settings, set "Neuron opacity" to 25%, then close them
6. Open "Raster" and "Neuron Table" again
7. Press "Spiking"

Show:

- All the neurons in 3D, and their firing rate ("Rate (Hz)")
- The replay playing
- The raster put away
- The settings have "Spike afterglow", and "Neuron opacity" reads 25%
- The raster back
- Only the neurons that fired, "N of 164,606 neurons selected", held for one
  pace at the end
