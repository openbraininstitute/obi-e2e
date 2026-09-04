# Circuit details

Opening one Circuit from its listing, under the models section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Circuit details

@private @readonly
Scenario: Open one Circuit beside the listing
  Given I am on the Circuit listing
  When I click a result
  Then I see its name
  And I see these properties:
    "species", "brain_region", "scale"
    "xxxxx", "number_neurons", "number_synapses"
    "number_connections", "build_category", "creation_date"
    "license", "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Circuit page
  Given I have opened one Circuit beside the listing
  When I choose to see its details
  Then I land on that Circuit's own page
  And I see these parts of the page:
    "visualizations", "visualization", "metadata-grid"
    "subject-details"
```
