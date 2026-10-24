# Synaptome

The Synaptome listing, under the models section of the Data page.

User: authenticated

## See the Synaptome table

Precondition:

1. Inside my project

Steps:

1. Open the Synaptome listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "Description", "Brain region"
  "Species", "Scale", "Number of neurons"
  "Number of synapses", "Number of connections", "Target simulator"
  "Created by"

## See the Synaptome results

Precondition:

1. Inside my project

Steps:

1. Open the Synaptome listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Synaptome listing

Precondition:

1. On the Synaptome listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## The Synaptome table offers no columns beyond these

Precondition:

1. On the Synaptome listing

Steps:

1. Open the column chooser

Expected:

- 12 columns are on and 0 are off
- No other column is on offer

## Every Synaptome filter narrows the listing

Precondition:

1. On the Synaptome listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "Brain region", "Species"
   "Number of neurons", "Number of synapses", "Number of connections"
   "Target simulator", "Created by", "Registration date"
   "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back

## Page through the Synaptome listing

Precondition:

1. On the Synaptome listing
2. There is more than one page of results

Steps:

1. Go to page 2

Expected:

- The results are different
- The total number of results does not change

Steps:

1. Go back to page 1

Expected:

- The first results are showing again
