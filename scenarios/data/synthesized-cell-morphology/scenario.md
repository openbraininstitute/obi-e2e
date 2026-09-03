# Synthesized morphology

The Synthesized morphology listing, under the models section of the Data page.

```gherkin
Feature: Synthesized morphology listing

@private @readonly
Scenario: See the Synthesized morphology table
  Given I am logged in
  And I am inside my project
  When I open the Synthesized morphology listing
  Then I see the table
    And I see the "Preview" column
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "M-type" column
    And I see the "Name" column
    And I see the "Contributors" column
    And I see the "Registration date" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Synthesized morphology results
  Given I am on the Synthesized morphology listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Synthesized morphology listing
  Given I am on the Synthesized morphology listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Synthesized morphology table
  Given I am on the Synthesized morphology listing
  When I open the column chooser
  And I turn on a column that is off, such as "Generation type", "Protocol design", "Protocol name", "Protocol document", "Strain", "Subject name", "Segmented spines"
  Then that column appears in the table

@private @readonly
Scenario: The Synthesized morphology table offers no columns beyond these
  Given I am on the Synthesized morphology listing
  When I open the column chooser
  Then 8 columns are on and 7 are off
  And there are no other columns on offer
```
