# Single cell electrophysiology

The Single cell electrophysiology listing, under the experimental section of the Data page.

User: lab member

## See the Single cell electrophysiology table

Precondition:

1. Inside my project

Steps:

1. Open the Single cell electrophysiology listing

Expected:

- The table is showing
- These columns are showing:
  "Preview", "Brain region", "Species"
  "E-type", "Name", "Contributors"
  "Registration date", "Lifecycle status"

## See the Single cell electrophysiology results

Precondition:

1. Inside my project

Steps:

1. Open the Single cell electrophysiology listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Single cell electrophysiology listing

Precondition:

1. On the Single cell electrophysiology listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## Add a hidden column to the Single cell electrophysiology table

Precondition:

1. On the Single cell electrophysiology listing

Steps:

1. Open the column chooser
2. Turn on each column that starts off:
   "Recording type", "Recording origin", "Strain"
   "Subject name"

Expected:

- That column appears in the table
- Turning it back off removes it

## The Single cell electrophysiology table offers no columns beyond these

Precondition:

1. On the Single cell electrophysiology listing

Steps:

1. Open the column chooser

Expected:

- 8 columns are on and 4 are off
- No other column is on offer

## Every Single cell electrophysiology filter narrows the listing

Precondition:

1. On the Single cell electrophysiology listing

Steps:

1. Filter by each of these columns in turn:
   "Brain region", "Species", "E-type"
   "Name", "Contributors", "Registration date"
   "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back

## Page through the Single cell electrophysiology listing

Precondition:

1. On the Single cell electrophysiology listing
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
