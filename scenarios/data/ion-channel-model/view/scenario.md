# Ion channel model details

Opening one Ion channel model from its listing, under the models section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Ion channel model details

@private @readonly
Scenario: Open one Ion channel model beside the listing
  Given I am on the Ion channel model listing
  When I click a result
  Then I see its name
  And I see these properties:
    "brain_region", "species", "temperature_celsius"
    "is_temperature_dependent", "is_ljp_corrected", "is_stochastic"
    "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Ion channel model page
  Given I have opened one Ion channel model beside the listing
  When I choose to see its details
  Then I land on that Ion channel model's own page
  And I see these parts of the page:
    "visualizations", "metadata-grid", "subject-details"
```
