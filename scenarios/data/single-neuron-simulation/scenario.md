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

@private @readonly
Scenario: The Single neuron (legacy) table offers no columns beyond these
  Given I am on the Single neuron (legacy) listing
  When I open the column chooser
  Then 10 columns are on and 0 are off
  And there are no other columns on offer
```
