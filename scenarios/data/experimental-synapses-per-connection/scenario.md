# Synapse per connection

The Synapse per connection listing, under the experimental section of the Data page.

```gherkin
Feature: Synapse per connection listing

@private @readonly
Scenario: See the Synapse per connection table
  Given I am logged in
  And I am inside my project
  When I open the Synapse per connection listing
  Then I see the table
  And I see these columns:
    "Brain Region [From]", "Brain Region [To]", "Cell Type [From]"
    "Cell Type [To]", "Mean ± STD [µm⁻¹]", "Species"
    "Age", "Contributors", "Lifecycle status"

@private @readonly
Scenario: See the Synapse per connection results
  Given I am on the Synapse per connection listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search the Synapse per connection listing
  Given I am on the Synapse per connection listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Synapse per connection table
  Given I am on the Synapse per connection listing
  When I open the column chooser
  And I turn on a column that is off:
    "Name", "Brain region", "Brain region acronym"
    "Strain", "Subject name"
  Then that column appears in the table
  And turning it back off removes it

@private @readonly
Scenario: The Synapse per connection table offers no columns beyond these
  Given I am on the Synapse per connection listing
  When I open the column chooser
  Then 9 columns are on and 5 are off
  And no other column is on offer

@private @readonly
Scenario: Every Synapse per connection filter narrows the listing
  Given I am on the Synapse per connection listing
  When I filter by each of these columns in turn:
    "Brain Region [From]", "Brain Region [To]", "Cell Type [From]"
    "Cell Type [To]", "Species", "Contributors"
    "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back
```
