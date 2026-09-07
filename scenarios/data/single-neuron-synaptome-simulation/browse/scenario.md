# Synaptome (legacy)

The Synaptome (legacy) listing, under the simulations section of the Data page.

User: authenticated

## See the Synaptome (legacy) table

Precondition:

1. Inside my project

Steps:

1. Open the Synaptome (legacy) listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "Description", "Stimulus"
  "Response", "Synaptome name", "Brain region"
  "Created by", "Registration date", "Lifecycle status"

## See the Synaptome (legacy) results

Precondition:

1. Inside my project

Steps:

1. Open the Synaptome (legacy) listing

Expected:

- The number of results is showing
- There is nothing to show yet

## The Synaptome (legacy) table offers no columns beyond these

Precondition:

1. On the Synaptome (legacy) listing

Steps:

1. Open the column chooser

Expected:

- 9 columns are on and 0 are off
- No other column is on offer

## Every Synaptome (legacy) filter narrows the listing

Precondition:

1. On the Synaptome (legacy) listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "Synaptome name", "Brain region"
   "Created by", "Registration date", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back
