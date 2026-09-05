# Synaptome

The Synaptome listing, under the simulations section of the Data page.

User: lab member

## See the Synaptome table

Precondition:

1. Inside my project

Steps:

1. Open the Synaptome listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "Description", "Circuit"
  "Created by", "Registration date", "Status"
  "Lifecycle status"

## See the Synaptome results

Precondition:

1. Inside my project

Steps:

1. Open the Synaptome listing

Expected:

- The number of results is showing
- There is nothing to show yet

## The Synaptome table offers no columns beyond these

Precondition:

1. On the Synaptome listing

Steps:

1. Open the column chooser

Expected:

- 7 columns are on and 0 are off
- No other column is on offer

## Every Synaptome filter narrows the listing

Precondition:

1. On the Synaptome listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "Circuit", "Created by"
   "Registration date", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back
