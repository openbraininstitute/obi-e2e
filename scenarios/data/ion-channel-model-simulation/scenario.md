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
    And I see the "Name" column
    And I see the "Description" column
    And I see the "Created by" column
    And I see the "Registration date" column
    And I see the "Status" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Ion channel results
  Given I am on the Ion channel listing
  Then I see how many results there are
  And I see that there is nothing to show yet
```
