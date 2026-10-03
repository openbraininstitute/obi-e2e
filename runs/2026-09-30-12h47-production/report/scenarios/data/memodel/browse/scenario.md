# ME-model

The ME-model listing, under the models section of the Data page.

User: authenticated

## See the ME-model table

Precondition:

1. Inside my project

Steps:

1. Open the ME-model listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "Morphology", "Trace"
  "Validated", "Brain region", "Species"
  "M-type", "E-type", "Created by"
  "Registration date"

## See the ME-model results

Precondition:

1. Inside my project

Steps:

1. Open the ME-model listing

Expected:

- The number of results is showing
- There is at least one result

## Search the ME-model listing

Precondition:

1. On the ME-model listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## Add a hidden column to the ME-model table

Precondition:

1. On the ME-model listing

Steps:

1. Open the column chooser
2. Turn on each column that starts off:
   "Morphology name", "Segmented spines", "E-model name"
   "E-model score", "Strain", "Contributors"

Expected:

- That column appears in the table
- Turning it back off removes it

## The ME-model table offers no columns beyond these

Precondition:

1. On the ME-model listing

Steps:

1. Open the column chooser

Expected:

- 11 columns are on and 6 are off
- No other column is on offer

## Every ME-model filter narrows the listing

Precondition:

1. On the ME-model listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "Brain region", "Species"
   "M-type", "E-type", "Created by"
   "Registration date", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back

## Page through the ME-model listing

Precondition:

1. On the ME-model listing
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
