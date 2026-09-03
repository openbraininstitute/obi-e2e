# Ion channel model

The Ion channel model listing, under the models section of the Data page.

```gherkin
Feature: Ion channel model listing

@private @readonly
Scenario: See the Ion channel model table
  Given I am logged in
  And I am inside my project
  When I open the Ion channel model listing
  Then I see the table
    And I see the "Preview" column
    And I see the "Name" column
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "Temperature [°C]" column
    And I see the "Temperature dependent" column
    And I see the "LJP corrected" column
    And I see the "Registration date" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Ion channel model results
  Given I am on the Ion channel model listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Ion channel model listing
  Given I am on the Ion channel model listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Ion channel model table
  Given I am on the Ion channel model listing
  When I open the column chooser
  And I turn on a column that is off, such as "NMODL suffix", "Conductance name", "Max permeability name", "Stochastic", "Strain", "Subject name", "Contributors"
  Then that column appears in the table

@private @readonly
Scenario: The Ion channel model table offers no columns beyond these
  Given I am on the Ion channel model listing
  When I open the column chooser
  Then 9 columns are on and 7 are off
  And there are no other columns on offer
```
