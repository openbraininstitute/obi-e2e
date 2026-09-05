# Microcircuit

The Microcircuit listing, under the simulations section of the Data page.

User: lab member

## See the Microcircuit table

Precondition:

1. Inside my project

Steps:

1. Open the Microcircuit listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "Description", "Circuit"
  "Created by", "Registration date", "Status"
  "Lifecycle status"

## See the Microcircuit results

Precondition:

1. Inside my project

Steps:

1. Open the Microcircuit listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Microcircuit listing

Precondition:

1. On the Microcircuit listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## The Microcircuit table offers no columns beyond these

Precondition:

1. On the Microcircuit listing

Steps:

1. Open the column chooser

Expected:

- 7 columns are on and 0 are off
- No other column is on offer

## Every Microcircuit filter narrows the listing

Precondition:

1. On the Microcircuit listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "Circuit", "Created by"
   "Registration date", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back
