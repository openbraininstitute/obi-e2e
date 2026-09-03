# Neuron density

The Neuron density listing, under the experimental section of the Data page.

```gherkin
Feature: Neuron density listing

@private @readonly
Scenario: See the Neuron density table
  Given I am logged in
  And I am inside my project
  When I open the Neuron density listing
  Then I see the table
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "M-type" column
    And I see the "E-type" column
    And I see the "Density [1/mm³]" column
    And I see the "N° of Measurements" column
    And I see the "Name" column
    And I see the "Age" column
    And I see the "Contributors" column
    And I see the "Registration date" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Neuron density results
  Given I am on the Neuron density listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Neuron density listing
  Given I am on the Neuron density listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Neuron density table
  Given I am on the Neuron density listing
  When I open the column chooser
  And I turn on a column that is off, such as "Strain", "Subject name"
  Then that column appears in the table

@private @readonly
Scenario: The Neuron density table offers no columns beyond these
  Given I am on the Neuron density listing
  When I open the column chooser
  Then 11 columns are on and 2 are off
  And there are no other columns on offer
```
