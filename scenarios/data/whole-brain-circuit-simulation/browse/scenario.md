# Whole brain circuit

The Whole brain circuit listing, under the simulations section of the Data page.

```gherkin
Feature: Whole brain circuit listing

@private @readonly
Scenario: See the Whole brain circuit table
  Given I am logged in
  And I am inside my project
  When I open the Whole brain circuit listing
  Then I see the table
  And I see these columns:
    "Name", "Description", "Circuit"
    "Created by", "Registration date", "Status"
    "Lifecycle status"

@private @readonly
Scenario: See the Whole brain circuit results
  Given I am on the Whole brain circuit listing
  Then I see how many results there are
  And I see that there is nothing to show yet

@private @readonly
Scenario: The Whole brain circuit table offers no columns beyond these
  Given I am on the Whole brain circuit listing
  When I open the column chooser
  Then 7 columns are on and 0 are off
  And no other column is on offer

@private @readonly
Scenario: Every Whole brain circuit filter narrows the listing
  Given I am on the Whole brain circuit listing
  When I filter by each of these columns in turn:
    "Name", "Circuit", "Created by"
    "Registration date", "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back
```
