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
```
