# Microcircuit

The Microcircuit listing, under the simulations section of the Data page.

```gherkin
Feature: Microcircuit listing

@private @readonly
Scenario: See the Microcircuit table
  Given I am logged in
  And I am inside my project
  When I open the Microcircuit listing
  Then I see the table
    And I see the "Name" column
    And I see the "Description" column
    And I see the "Circuit" column
    And I see the "Created by" column
    And I see the "Registration date" column
    And I see the "Status" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Microcircuit results
  Given I am on the Microcircuit listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Microcircuit listing
  Given I am on the Microcircuit listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back
```
