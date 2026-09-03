# ME-model

The ME-model listing, under the models section of the Data page.

```gherkin
Feature: ME-model listing

@private @readonly
Scenario: See the ME-model table
  Given I am logged in
  And I am inside my project
  When I open the ME-model listing
  Then I see the table
    And I see the "Name" column
    And I see the "Morphology" column
    And I see the "Trace" column
    And I see the "Validated" column
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "M-type" column
    And I see the "E-type" column
    And I see the "Created by" column
    And I see the "Registration date" column

@private @readonly
Scenario: See the ME-model results
  Given I am on the ME-model listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the ME-model listing
  Given I am on the ME-model listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the ME-model table
  Given I am on the ME-model listing
  When I open the column chooser
  And I turn on a column that is off, such as "Morphology name", "Segmented spines", "E-model name", "E-model score", "Strain", "Contributors"
  Then that column appears in the table

@private @readonly
Scenario: The ME-model table offers no columns beyond these
  Given I am on the ME-model listing
  When I open the column chooser
  Then 11 columns are on and 6 are off
  And there are no other columns on offer
```
