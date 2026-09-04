# Single cell electrophysiology details

Opening one Single cell electrophysiology from its listing, under the experimental section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Single cell electrophysiology details

@private @readonly
Scenario: Open one Single cell electrophysiology beside the listing
  Given I am on the Single cell electrophysiology listing
  When I click a result
  Then I see its name
  And I see these properties:
    "brain_region", "etype", "species"
    "license", "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Single cell electrophysiology page
  Given I have opened one Single cell electrophysiology beside the listing
  When I choose to see its details
  Then I land on that Single cell electrophysiology's own page
  And I see these parts of the page:
    "visualizations", "metadata-grid", "subject-details"
```
