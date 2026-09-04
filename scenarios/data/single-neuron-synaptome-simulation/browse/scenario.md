# Synaptome (legacy)

The Synaptome (legacy) listing, under the simulations section of the Data page.

```gherkin
Feature: Synaptome (legacy) listing

@private @readonly
Scenario: See the Synaptome (legacy) table
  Given I am logged in
  And I am inside my project
  When I open the Synaptome (legacy) listing
  Then I see the table
  And I see these columns:
    "Name", "Description", "Stimulus"
    "Response", "Synaptome name", "Brain region"
    "Created by", "Registration date", "Lifecycle status"

@private @readonly
Scenario: See the Synaptome (legacy) results
  Given I am on the Synaptome (legacy) listing
  Then I see how many results there are
  And I see that there is nothing to show yet

@private @readonly
Scenario: The Synaptome (legacy) table offers no columns beyond these
  Given I am on the Synaptome (legacy) listing
  When I open the column chooser
  Then 9 columns are on and 0 are off
  And no other column is on offer

@private @readonly
Scenario: Every Synaptome (legacy) filter narrows the listing
  Given I am on the Synaptome (legacy) listing
  When I filter by each of these columns in turn:
    "Name", "Synaptome name", "Brain region"
    "Created by", "Registration date", "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back
```
