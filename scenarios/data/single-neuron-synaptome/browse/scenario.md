# Synaptome (legacy)

The Synaptome (legacy) listing, under the models section of the Data page.

```gherkin
Feature: Synaptome (legacy) listing

@private @readonly
Scenario: See the Synaptome (legacy) table
  Given I am logged in
  And I am inside my project
  When I open the Synaptome (legacy) listing
  Then I see the table
  And I see these columns:
    "Name", "Description", "ME-model"
    "M-type", "E-type", "Brain region"
    "Species", "Created by", "Registration date"

@private @readonly
Scenario: See the Synaptome (legacy) results
  Given I am on the Synaptome (legacy) listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search the Synaptome (legacy) listing
  Given I am on the Synaptome (legacy) listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Synaptome (legacy) table
  Given I am on the Synaptome (legacy) listing
  When I open the column chooser
  And I turn on a column that is off:
    "ME-model validation status", "Contributors"
  Then that column appears in the table
  And turning it back off removes it

@private @readonly
Scenario: The Synaptome (legacy) table offers no columns beyond these
  Given I am on the Synaptome (legacy) listing
  When I open the column chooser
  Then 10 columns are on and 2 are off
  And no other column is on offer

@private @readonly
Scenario: Every Synaptome (legacy) filter narrows the listing
  Given I am on the Synaptome (legacy) listing
  When I filter by each of these columns in turn:
    "Name", "ME-model", "M-type"
    "E-type", "Brain region", "Species"
    "Created by", "Registration date", "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back
```
