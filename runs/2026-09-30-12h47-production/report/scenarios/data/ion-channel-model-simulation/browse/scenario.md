# Ion channel

The Ion channel listing, under the simulations section of the Data page.

User: authenticated

## See the Ion channel table

Precondition:

1. Inside my project

Steps:

1. Open the Ion channel listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "Description", "Created by"
  "Registration date", "Status", "Lifecycle status"

## See the Ion channel results

Precondition:

1. Inside my project

Steps:

1. Open the Ion channel listing

Expected:

- The number of results is showing
- There is nothing to show yet

## The Ion channel table offers no columns beyond these

Precondition:

1. On the Ion channel listing

Steps:

1. Open the column chooser

Expected:

- 6 columns are on and 0 are off
- No other column is on offer

## Every Ion channel filter narrows the listing

Precondition:

1. On the Ion channel listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "Created by", "Registration date"
   "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back
