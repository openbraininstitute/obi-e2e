# Single neuron (legacy)

The Single neuron (legacy) listing, under the simulations section of the Data page.

User: authenticated

## See the Single neuron (legacy) table

Precondition:

1. Inside my project

Steps:

1. Open the Single neuron (legacy) listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "ME-model", "Stimulus"
  "Response", "Injection location", "Recording location"
  "Brain region", "Created by", "Registration date"
  "Lifecycle status"

## See the Single neuron (legacy) results

Precondition:

1. Inside my project

Steps:

1. Open the Single neuron (legacy) listing

Expected:

- The number of results is showing
- There is nothing to show yet

## The Single neuron (legacy) table offers no columns beyond these

Precondition:

1. On the Single neuron (legacy) listing

Steps:

1. Open the column chooser

Expected:

- 10 columns are on and 0 are off
- No other column is on offer

## Every Single neuron (legacy) filter narrows the listing

Precondition:

1. On the Single neuron (legacy) listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "ME-model", "Brain region"
   "Created by", "Registration date", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back
