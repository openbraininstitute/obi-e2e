# Ion channel electrophysiology details

Opening one Ion channel electrophysiology from its listing, under the experimental section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Ion channel electrophysiology details

@private @readonly
Scenario: Open one Ion channel electrophysiology beside the listing
  Given I am on the Ion channel electrophysiology listing
  When I click a result
  Then I see its name
  And I see these properties:
    "brain_region", "ion_channel", "temperature"
    "cell_line", "species", "license"
    "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Ion channel electrophysiology page
  Given I have opened one Ion channel electrophysiology beside the listing
  When I choose to see its details
  Then I land on that Ion channel electrophysiology's own page
  And I see these parts of the page:
    "visualizations", "metadata-grid", "subject-details"
```
