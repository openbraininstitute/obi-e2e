# Browse morphologies

Scenarios for the morphology listing, reached from the Data page.

```gherkin
Feature: Browse morphologies

@private @readonly
Scenario: Open the morphology listing
  Given I am logged in
  And I am inside my project
  When I open the Data page
  And I choose "Morphology"
  Then I see the morphology table
  And I see the columns: Brain region, Species, M-type, Name
  And I see at least one morphology

@private @readonly
Scenario: The listing offers filters and column choices
  Given I am on the morphology listing
  Then I see a "Filters" control
  And I see a "Columns" control
```
