# Circuit

The Circuit listing, under the models section of the Data page.

User: lab member

## See the Circuit table

Precondition:

1. Inside my project

Steps:

1. Open the Circuit listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "Subcircuits", "Description"
  "Brain region", "Species", "Scale"
  "Number of neurons", "Number of synapses", "Number of connections"
  "Build category"

## See the Circuit results

Precondition:

1. Inside my project

Steps:

1. Open the Circuit listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Circuit listing

Precondition:

1. On the Circuit listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## Add a hidden column to the Circuit table

Precondition:

1. On the Circuit listing

Steps:

1. Open the column chooser
2. Turn on each column that starts off:
   "Has morphologies", "Has point neurons", "Has electrical cell models"
   "Has spines", "Strain", "Subject name"
   "Contributors"

Expected:

- That column appears in the table
- Turning it back off removes it

## The Circuit table offers no columns beyond these

Precondition:

1. On the Circuit listing

Steps:

1. Open the column chooser

Expected:

- 15 columns are on and 7 are off
- No other column is on offer

## Every Circuit filter narrows the listing

Precondition:

1. On the Circuit listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "Brain region", "Species"
   "Scale", "Number of neurons", "Number of synapses"
   "Number of connections", "Build category", "Target simulator"
   "Derivation type", "Published in", "Experiment date"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back

## Switch between the flat and hierarchy views

Precondition:

1. On the Circuit listing

Expected:

- The "Subcircuits" column is showing

Steps:

1. Switch the view

Expected:

- The "Subcircuits" column is gone
- The "Lifecycle status" column is showing instead

Steps:

1. Switch back

Expected:

- The "Subcircuits" column is showing again
