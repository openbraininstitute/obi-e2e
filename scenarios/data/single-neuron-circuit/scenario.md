# Synaptome

The Synaptome listing, under the models section of the Data page.

```gherkin
Feature: Synaptome listing

@private @readonly
Scenario: See the Synaptome table
  Given I am logged in
  And I am inside my project
  When I open the Synaptome listing
  Then I see the table
    And I see the "Name" column
    And I see the "Description" column
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "Scale" column
    And I see the "Number of neurons" column
    And I see the "Number of synapses" column
    And I see the "Number of connections" column
    And I see the "Target simulator" column
    And I see the "Created by" column

@private @readonly
Scenario: See the Synaptome results
  Given I am on the Synaptome listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Synaptome listing
  Given I am on the Synaptome listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: The Synaptome table offers no columns beyond these
  Given I am on the Synaptome listing
  When I open the column chooser
  Then 12 columns are on and 0 are off
  And there are no other columns on offer
```
