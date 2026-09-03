# Ion channel

The Ion channel listing, under the simulations section of the Data page.

```gherkin
Feature: Ion channel listing

@private @readonly
Scenario: See the Ion channel table
  Given I am logged in
  And I am inside my project
  When I open the Ion channel listing
  Then I see the table
  And I see these columns:
    "Name", "Description", "Created by"
    "Registration date", "Status", "Lifecycle status"

@private @readonly
Scenario: See the Ion channel results
  Given I am on the Ion channel listing
  Then I see how many results there are
  And I see that there is nothing to show yet

@private @readonly
Scenario: The Ion channel table offers no columns beyond these
  Given I am on the Ion channel listing
  When I open the column chooser
  Then 6 columns are on and 0 are off
  And no other column is on offer

@private @readonly
Scenario: Every Ion channel filter narrows the listing
  Given I am on the Ion channel listing
  When I filter by each of these columns in turn:
    "Name", "Created by", "Registration date"
    "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back
```
