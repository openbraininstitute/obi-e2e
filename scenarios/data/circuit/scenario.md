# Circuit

The Circuit listing, under the models section of the Data page.

```gherkin
Feature: Circuit listing

@private @readonly
Scenario: See the Circuit table
  Given I am logged in
  And I am inside my project
  When I open the Circuit listing
  Then I see the table
    And I see the "Name" column
    And I see the "Subcircuits" column
    And I see the "Description" column
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "Scale" column
    And I see the "Number of neurons" column
    And I see the "Number of synapses" column
    And I see the "Number of connections" column
    And I see the "Build category" column

@private @readonly
Scenario: See the Circuit results
  Given I am on the Circuit listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Circuit listing
  Given I am on the Circuit listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Circuit table
  Given I am on the Circuit listing
  When I open the column chooser
  And I turn on a column that is off, such as "Has morphologies", "Has point neurons", "Has electrical cell models", "Has spines", "Strain", "Subject name", "Contributors"
  Then that column appears in the table

@private @readonly
Scenario: The Circuit table offers no columns beyond these
  Given I am on the Circuit listing
  When I open the column chooser
  Then 15 columns are on and 7 are off
  And there are no other columns on offer
```
