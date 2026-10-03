# EM mesh

The EM mesh listing, under the experimental section of the Data page.

User: authenticated

## See the EM mesh table

Precondition:

1. Inside my project

Steps:

1. Open the EM mesh listing

Expected:

- The table is showing
- These columns are showing:
  "Name", "Brain region", "Species"
  "Version", "Dataset", "Registration date"
  "Lifecycle status"

## See the EM mesh results

Precondition:

1. Inside my project

Steps:

1. Open the EM mesh listing

Expected:

- The number of results is showing
- There is at least one result

## Search the EM mesh listing

Precondition:

1. On the EM mesh listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## Add a hidden column to the EM mesh table

Precondition:

1. On the EM mesh listing

Steps:

1. Open the column chooser
2. Turn on each column that starts off:
   "Mesh type", "Level of detail", "M-type"
   "Dataset published in", "Dataset experiment date", "Strain"
   "Subject name"

Expected:

- That column appears in the table
- Turning it back off removes it

## The EM mesh table offers no columns beyond these

Precondition:

1. On the EM mesh listing

Steps:

1. Open the column chooser

Expected:

- 7 columns are on and 7 are off
- No other column is on offer

## Every EM mesh filter narrows the listing

Precondition:

1. On the EM mesh listing

Steps:

1. Filter by each of these columns in turn:
   "Name", "Brain region", "Species"
   "Version", "Dataset", "Registration date"
   "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back

## Page through the EM mesh listing

Precondition:

1. On the EM mesh listing
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
