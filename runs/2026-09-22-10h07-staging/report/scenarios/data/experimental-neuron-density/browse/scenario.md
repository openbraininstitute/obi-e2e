# Neuron density

The Neuron density listing, under the experimental section of the Data page.

User: authenticated

## See the Neuron density table

Precondition:

1. Inside my project

Steps:

1. Open the Neuron density listing

Expected:

- The table is showing
- These columns are showing:
  "Brain region", "Species", "M-type"
  "E-type", "Density [1/mm³]", "N° of Measurements"
  "Name", "Age", "Contributors"
  "Registration date", "Lifecycle status"

## See the Neuron density results

Precondition:

1. Inside my project

Steps:

1. Open the Neuron density listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Neuron density listing

Precondition:

1. On the Neuron density listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## Add a hidden column to the Neuron density table

Precondition:

1. On the Neuron density listing

Steps:

1. Open the column chooser
2. Turn on each column that starts off:
   "Strain", "Subject name"

Expected:

- That column appears in the table
- Turning it back off removes it

## The Neuron density table offers no columns beyond these

Precondition:

1. On the Neuron density listing

Steps:

1. Open the column chooser

Expected:

- 11 columns are on and 2 are off
- No other column is on offer

## Every Neuron density filter narrows the listing

Precondition:

1. On the Neuron density listing

Steps:

1. Filter by each of these columns in turn:
   "Brain region", "Species", "M-type"
   "E-type", "Name", "Contributors"
   "Registration date", "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back

## Page through the Neuron density listing

Precondition:

1. On the Neuron density listing
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
