# Ion channel electrophysiology

The Ion channel electrophysiology listing, under the experimental section of the Data page.

```gherkin
Feature: Ion channel electrophysiology listing

@private @readonly
Scenario: See the Ion channel electrophysiology table
  Given I am logged in
  And I am inside my project
  When I open the Ion channel electrophysiology listing
  Then I see the table
    And I see the "Preview" column
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "Ion channel" column
    And I see the "Temperature [°C]" column
    And I see the "Cell line" column
    And I see the "Name" column
    And I see the "Contributors" column
    And I see the "Registration date" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Ion channel electrophysiology results
  Given I am on the Ion channel electrophysiology listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Ion channel electrophysiology listing
  Given I am on the Ion channel electrophysiology listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Ion channel electrophysiology table
  Given I am on the Ion channel electrophysiology listing
  When I open the column chooser
  And I turn on a column that is off, such as "Ion channel label", "Gene", "Validation passed", "Validation name", "Recording type", "Strain", "Subject name"
  Then that column appears in the table

@private @readonly
Scenario: The Ion channel electrophysiology table offers no columns beyond these
  Given I am on the Ion channel electrophysiology listing
  When I open the column chooser
  Then 10 columns are on and 7 are off
  And there are no other columns on offer
```
