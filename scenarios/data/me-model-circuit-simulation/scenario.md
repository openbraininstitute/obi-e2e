# Single neuron

The Single neuron listing, under the simulations section of the Data page.

```gherkin
Feature: Single neuron listing

@private @readonly
Scenario: See the Single neuron table
  Given I am logged in
  And I am inside my project
  When I open the Single neuron listing
  Then I see the table
    And I see the "Name" column
    And I see the "Description" column
    And I see the "ME-model" column
    And I see the "Created by" column
    And I see the "Species" column
    And I see the "Registration date" column
    And I see the "Status" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Single neuron results
  Given I am on the Single neuron listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Single neuron listing
  Given I am on the Single neuron listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: The Single neuron table offers no columns beyond these
  Given I am on the Single neuron listing
  When I open the column chooser
  Then 8 columns are on and 0 are off
  And there are no other columns on offer
```
