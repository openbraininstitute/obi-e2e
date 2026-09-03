# Morphology

The Morphology listing, under the experimental section of the Data page.

```gherkin
Feature: Morphology listing

@private @readonly
Scenario: See the Morphology table
  Given I am logged in
  And I am inside my project
  When I open the Morphology listing
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
Scenario: See the Morphology results
  Given I am on the Morphology listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Morphology listing
  Given I am on the Morphology listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Morphology table
  Given I am on the Morphology listing
  When I open the column chooser
  And I turn on a column that is off, such as "Generation type", "Protocol design", "Protocol name", "Protocol document", "Strain", "Subject name", "Segmented spines"
  Then that column appears in the table

@private @readonly
Scenario: The Morphology table offers no columns beyond these
  Given I am on the Morphology listing
  When I open the column chooser
  Then 8 columns are on and 7 are off
  And there are no other columns on offer
```
