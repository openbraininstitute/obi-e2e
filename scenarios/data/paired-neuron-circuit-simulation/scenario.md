# Paired neurons

The Paired neurons listing, under the simulations section of the Data page.

```gherkin
Feature: Paired neurons listing

@private @readonly
Scenario: See the Paired neurons table
  Given I am logged in
  And I am inside my project
  When I open the Paired neurons listing
  Then I see the table
    And I see the "Name" column
    And I see the "Description" column
    And I see the "Circuit" column
    And I see the "Created by" column
    And I see the "Registration date" column
    And I see the "Status" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Paired neurons results
  Given I am on the Paired neurons listing
  Then I see how many results there are
  And I see that there is nothing to show yet

@private @readonly
Scenario: The Paired neurons table offers no columns beyond these
  Given I am on the Paired neurons listing
  When I open the column chooser
  Then 7 columns are on and 0 are off
  And there are no other columns on offer
```
