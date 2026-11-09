# Microcircuit simulation of layer 4

We set up a simulation on one column of the rat cortex: poke the inhibitory
neurons of layer 4 and record the excitatory neurons around them. We stop just
before launching it.

The demo had the "circuit-morphologies" feature flag on, so the film turns it
on too.

Pace: 2 seconds
User: credits
Seed: seed.json

## The project home

Steps:

1. Open my project's home page
2. Press "Workflows" in the top bar

Show:

- The Workflows page, with "Simulate"

## Starting a microcircuit simulation

Steps:

1. Point at "Simulate" as "Workflows": "Simulate runs a model. Microcircuit is
   the one for a column of the cortex."
2. Pick "Simulate"
3. Start "Microcircuit"

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
7. Point at "Use model" as "The circuit": "nbS1-HEX0, the column in the middle
   of the rat's hindlimb cortex. About 30,000 neurons."
8. Press "Use model"

Show:

- The circuit's row
- The form

## The circuit viewer

Steps:

1. Point at "Colour by" as "The viewer": "The neurons of the column. Colour
   them by layer to see the six layers."
2. Colour by "Layer"
3. Turn the column with the mouse

Show:

- "Colour by" reads "Layer"

## Filling the form, and generating the simulation

Steps:

1. Point at "Generate simulation(s)" as "The form": "Three groups of neurons
   by layer and type. We poke the layer 4 inhibitory ones at 150% of their
   threshold, and record the excitatory ones in layer 4 and layers 2 and 3."
2. Fill the form from the configuration in the seed
3. Rename the neuron sets "L4 INH", "L4 EXC" and "L23 EXC", and the
   recordings "L4 EXC Rec" and "L23 EXC Rec"
4. Press "Generate simulation(s)"
5. Go back to the configuration tab, then to the simulations tab
6. Point at "Launch simulations" as "Ready to launch": "One simulation, ready
   to go. We stop here: launching it would spend credits."

Show:

- The new names in the form
- One simulation, "created", with its input files
- "Launch simulations", not pressed, held for one pace at the end
