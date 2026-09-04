# Synthesized morphology details

Opening one Synthesized morphology from its listing, under the models section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Synthesized morphology details

@private @readonly
Scenario: Open one Synthesized morphology beside the listing
  Given I am on the Synthesized morphology listing
  When I click a result
  Then I see its name
  And I see these properties:
    "brain_region", "species", "mtype"
    "license", "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Synthesized morphology page
  Given I have opened one Synthesized morphology beside the listing
  When I choose to see its details
  Then I land on that Synthesized morphology's own page
  And I see these parts of the page:
    "visualizations", "morpho-viewer", "metadata-grid"
    "subject-details", "morphometrics"
```
