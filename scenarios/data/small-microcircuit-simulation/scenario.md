# Small microcircuit

The Small microcircuit listing, under the simulations section of the Data page.

```gherkin
Feature: Small microcircuit listing

@private @readonly
Scenario: See the Small microcircuit table
  Given I am logged in
  And I am inside my project
  When I open the Small microcircuit listing
  Then I see the table
  And I see these columns:
    "Name", "Description", "Circuit"
    "Created by", "Registration date", "Status"
    "Lifecycle status"

@private @readonly
Scenario: See the Small microcircuit results
  Given I am on the Small microcircuit listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search the Small microcircuit listing
  Given I am on the Small microcircuit listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: The Small microcircuit table offers no columns beyond these
  Given I am on the Small microcircuit listing
  When I open the column chooser
  Then 7 columns are on and 0 are off
  And no other column is on offer

@private @readonly
Scenario: Every Small microcircuit filter narrows the listing
  Given I am on the Small microcircuit listing
  When I filter by each of these columns in turn:
    "Name", "Circuit", "Created by"
    "Registration date", "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back
```
