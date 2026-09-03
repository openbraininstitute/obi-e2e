# Home page

Scenarios for the public landing page.

```gherkin
Feature: Home page

@smoke @readonly
Scenario: Open the home page
  When I open the home page
  Then I see the "Create your Virtual Lab" headline
  And I see a "Login" link
  And I see a "Go to Virtual Labs" link
```
