# Single neuron (legacy)

The Single neuron (legacy) listing, under the simulations section of the Data page.

```gherkin
Feature: Single neuron (legacy) listing

@private @readonly
Scenario: See the Single neuron (legacy) table
  Given I am logged in
  And I am inside my project
  When I open the Single neuron (legacy) listing
  Then I see the table
    And I see the "Name" column
    And I see the "ME-model" column
    And I see the "Stimulus" column
    And I see the "Response" column
    And I see the "Injection location" column
    And I see the "Recording location" column
    And I see the "Brain region" column
    And I see the "Created by" column
    And I see the "Registration date" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Single neuron (legacy) results
  Given I am on the Single neuron (legacy) listing
  Then I see how many results there are
  And I see that there is nothing to show yet
```
