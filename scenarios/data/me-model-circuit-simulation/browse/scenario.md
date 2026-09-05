# Single neuron

The Single neuron listing, under the simulations section of the Data page.

User: lab member

## See the Single neuron table

Precondition:

1. Inside my project

Steps:

1. Open the Single neuron listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "Description", "ME-model"
  "Created by", "Species", "Registration date"
  "Status", "Lifecycle status"

## See the Single neuron results

Precondition:

1. Inside my project

Steps:

1. Open the Single neuron listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Single neuron listing

Precondition:

1. On the Single neuron listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## The Single neuron table offers no columns beyond these

Precondition:

1. On the Single neuron listing

Steps:

1. Open the column chooser

Expected:

- 8 columns are on and 0 are off
- No other column is on offer

## Every Single neuron filter narrows the listing

Precondition:

1. On the Single neuron listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "ME-model", "Created by"
   "Registration date", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back
