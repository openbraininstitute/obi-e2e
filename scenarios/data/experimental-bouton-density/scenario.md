# Bouton density

The Bouton density listing, under the experimental section of the Data page.

```gherkin
Feature: Bouton density listing

@private @readonly
Scenario: See the Bouton density table
  Given I am logged in
  And I am inside my project
  When I open the Bouton density listing
  Then I see the table
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "M-type" column
    And I see the "Mean ± STD [µm⁻¹]" column
    And I see the "SEM" column
    And I see the "N° of Measurements" column
    And I see the "Contributors" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Bouton density results
  Given I am on the Bouton density listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Bouton density listing
  Given I am on the Bouton density listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Bouton density table
  Given I am on the Bouton density listing
  When I open the column chooser
  And I turn on a column that is off, such as "Name", "Strain", "Subject name"
  Then that column appears in the table

@private @readonly
Scenario: The Bouton density table offers no columns beyond these
  Given I am on the Bouton density listing
  When I open the column chooser
  Then 8 columns are on and 3 are off
  And there are no other columns on offer
```
