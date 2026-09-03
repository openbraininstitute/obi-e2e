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
    And I see the "Name" column
    And I see the "Description" column
    And I see the "Circuit" column
    And I see the "Created by" column
    And I see the "Registration date" column
    And I see the "Status" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Small microcircuit results
  Given I am on the Small microcircuit listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Small microcircuit listing
  Given I am on the Small microcircuit listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: The Small microcircuit table offers no columns beyond these
  Given I am on the Small microcircuit listing
  When I open the column chooser
  Then 7 columns are on and 0 are off
  And there are no other columns on offer
```
