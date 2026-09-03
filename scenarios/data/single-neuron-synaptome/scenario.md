# Synaptome (legacy)

The Synaptome (legacy) listing, under the models section of the Data page.

```gherkin
Feature: Synaptome (legacy) listing

@private @readonly
Scenario: See the Synaptome (legacy) table
  Given I am logged in
  And I am inside my project
  When I open the Synaptome (legacy) listing
  Then I see the table
    And I see the "Name" column
    And I see the "Description" column
    And I see the "ME-model" column
    And I see the "M-type" column
    And I see the "E-type" column
    And I see the "Brain region" column
    And I see the "Species" column
    And I see the "Created by" column
    And I see the "Registration date" column

@private @readonly
Scenario: See the Synaptome (legacy) results
  Given I am on the Synaptome (legacy) listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Synaptome (legacy) listing
  Given I am on the Synaptome (legacy) listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back
```
