# Bouton density

The Bouton density listing, under the experimental section of the Data page.

User: lab member

## See the Bouton density table

Precondition:

1. Inside my project

Steps:

1. Open the Bouton density listing

Expected:

- The table is showing
- These columns are showing:
  "Brain region", "Species", "M-type"
  "Mean ± STD [µm⁻¹]", "SEM", "N° of Measurements"
  "Contributors", "Lifecycle status"

## See the Bouton density results

Precondition:

1. Inside my project

Steps:

1. Open the Bouton density listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Bouton density listing

Precondition:

1. On the Bouton density listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## Add a hidden column to the Bouton density table

Precondition:

1. On the Bouton density listing

Steps:

1. Open the column chooser
2. Turn on each column that starts off:
   "Name", "Strain", "Subject name"

Expected:

- That column appears in the table
- Turning it back off removes it

## The Bouton density table offers no columns beyond these

Precondition:

1. On the Bouton density listing

Steps:

1. Open the column chooser

Expected:

- 8 columns are on and 3 are off
- No other column is on offer

## Every Bouton density filter narrows the listing

Precondition:

1. On the Bouton density listing

Steps:

1. Filter by each of these columns in turn:
   "Brain region", "Species", "M-type"
   "Contributors", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back
