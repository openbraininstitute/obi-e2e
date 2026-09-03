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
    And I see the "Name" column
    And I see the "Description" column
    And I see the "Stimulus" column
    And I see the "Response" column
    And I see the "Synaptome name" column
    And I see the "Brain region" column
    And I see the "Created by" column
    And I see the "Registration date" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Synaptome (legacy) results
  Given I am on the Synaptome (legacy) listing
  Then I see how many results there are
  And I see that there is nothing to show yet
```
