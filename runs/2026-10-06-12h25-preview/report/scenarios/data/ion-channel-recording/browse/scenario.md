# Ion channel electrophysiology

The Ion channel electrophysiology listing, under the experimental section of the Data page.

User: authenticated

## See the Ion channel electrophysiology table

Precondition:

1. Inside my project

Steps:

1. Open the Ion channel electrophysiology listing

Expected:

- The table is showing
- These columns are showing:
  "Preview", "Brain region", "Species"
  "Ion channel", "Temperature [°C]", "Cell line"
  "Name", "Contributors", "Registration date"
  "Lifecycle status"

## See the Ion channel electrophysiology results

Precondition:

1. Inside my project

Steps:

1. Open the Ion channel electrophysiology listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Ion channel electrophysiology listing

Precondition:

1. On the Ion channel electrophysiology listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## Add a hidden column to the Ion channel electrophysiology table

Precondition:

1. On the Ion channel electrophysiology listing

Steps:

1. Open the column chooser
2. Turn on each column that starts off:
   "Ion channel label", "Gene", "Validation passed"
   "Validation name", "Recording type", "Strain"
   "Subject name"

Expected:

- That column appears in the table
- Turning it back off removes it

## The Ion channel electrophysiology table offers no columns beyond these

Precondition:

1. On the Ion channel electrophysiology listing

Steps:

1. Open the column chooser

Expected:

- 10 columns are on and 7 are off
- No other column is on offer

## Every Ion channel electrophysiology filter narrows the listing

Precondition:

1. On the Ion channel electrophysiology listing

Steps:

1. Filter by each of these columns in turn:
   "Brain region", "Species", "Ion channel"
   "Temperature", "Cell line", "Name"
   "Contributors", "Registration date", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back

## Page through the Ion channel electrophysiology listing

Precondition:

1. On the Ion channel electrophysiology listing
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
