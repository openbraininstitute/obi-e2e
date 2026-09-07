# Synapse per connection

The Synapse per connection listing, under the experimental section of the Data page.

User: authenticated

## See the Synapse per connection table

Precondition:

1. Inside my project

Steps:

1. Open the Synapse per connection listing

Expected:

- The table is showing
- These columns are showing:
  "Brain Region [From]", "Brain Region [To]", "Cell Type [From]"
  "Cell Type [To]", "Mean ± STD [µm⁻¹]", "Species"
  "Age", "Contributors", "Lifecycle status"

## See the Synapse per connection results

Precondition:

1. Inside my project

Steps:

1. Open the Synapse per connection listing

Expected:

- The number of results is showing
- There is at least one result

## Search the Synapse per connection listing

Precondition:

1. On the Synapse per connection listing

Steps:

1. Search for something no entity matches

Expected:

- No results are showing
- Clearing the search brings them all back

## Add a hidden column to the Synapse per connection table

Precondition:

1. On the Synapse per connection listing

Steps:

1. Open the column chooser
2. Turn on each column that starts off:
   "Name", "Brain region", "Brain region acronym"
   "Strain", "Subject name"

Expected:

- That column appears in the table
- Turning it back off removes it

## The Synapse per connection table offers no columns beyond these

Precondition:

1. On the Synapse per connection listing

Steps:

1. Open the column chooser

Expected:

- 9 columns are on and 5 are off
- No other column is on offer

## Every Synapse per connection filter narrows the listing

Precondition:

1. On the Synapse per connection listing

Steps:

1. Filter by each of these columns in turn:
   "Brain Region [From]", "Brain Region [To]", "Cell Type [From]"
   "Cell Type [To]", "Species", "Contributors"
   "Lifecycle status"

Expected:

- A filter offering a list of values gives exactly the count it promised
- A filter typed into gives no results for a value nothing matches
- A range filter given a minimum above its maximum gives no results
- Clearing each filter brings the listing back
