# Data page

Scenarios for the Data page inside a project.

```gherkin
Feature: Data page

@private @readonly
Scenario: See the experimental data types
  Given I am logged in
  And I am inside my project
  When I open the Data page
  Then I can choose between the "Public" and "Project" scopes
  And I see the "Experimental", "Model" and "Simulations" sections
  And I see "Morphology" in the list of data types
  And I see how many morphologies there are

@private @readonly
Scenario: Switch to the model data types
  Given I am on the Data page
  When I choose the "Model" section
  Then I see "E-model" in the list of data types
  And I no longer see "Morphology"

@private @readonly
Scenario: Switch to my project's data
  Given I am on the Data page
  When I choose the "Project" scope
  Then the page stays on the Data page
  And I still see the list of data types
```
