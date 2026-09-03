# EM mesh

The EM mesh listing, under the experimental section of the Data page.

```gherkin
Feature: EM mesh listing

@private @readonly
Scenario: See the EM mesh table
  Given I am logged in
  And I am inside my project
  When I open the EM mesh listing
  Then I see the table
    And I see the "Name" column
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "Version" column
    And I see the "Dataset" column
    And I see the "Registration date" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the EM mesh results
  Given I am on the EM mesh listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the EM mesh listing
  Given I am on the EM mesh listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the EM mesh table
  Given I am on the EM mesh listing
  When I open the column chooser
  And I turn on a column that is off, such as "Mesh type", "Level of detail", "M-type", "Dataset published in", "Dataset experiment date", "Strain", "Subject name"
  Then that column appears in the table

@private @readonly
Scenario: The EM mesh table offers no columns beyond these
  Given I am on the EM mesh listing
  When I open the column chooser
  Then 7 columns are on and 7 are off
  And there are no other columns on offer
```
