# Ion channel model

The Ion channel model listing, under the models section of the Data page.

User: authenticated

## See the Ion channel model table

Precondition:

1. Inside my project

Steps:

1. Open the Ion channel model listing

Expected:

- The table is showing
- These columns are showing:
  "Preview", "Name", "Brain region"
  "Species", "Temperature [°C]", "Temperature dependent"
  "LJP corrected", "Registration date", "Lifecycle status"

## See the Ion channel model results

Precondition:

1. Inside my project

Steps:

1. Open the Ion channel model listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Ion channel model listing

Precondition:

1. On the Ion channel model listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## Add a hidden column to the Ion channel model table

Precondition:

1. On the Ion channel model listing

Steps:

1. Open the column chooser
2. Turn on each column that starts off:
   "NMODL suffix", "Conductance name", "Max permeability name"
   "Stochastic", "Strain", "Subject name"
   "Contributors"

Expected:

- That column appears in the table
- Turning it back off removes it

## The Ion channel model table offers no columns beyond these

Precondition:

1. On the Ion channel model listing

Steps:

1. Open the column chooser

Expected:

- 9 columns are on and 7 are off
- No other column is on offer

## Every Ion channel model filter narrows the listing

Precondition:

1. On the Ion channel model listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "Brain region", "Species"
   "Temperature", "Temperature dependent", "LJP corrected"
   "Registration date", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back

## Page through the Ion channel model listing

Precondition:

1. On the Ion channel model listing
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
