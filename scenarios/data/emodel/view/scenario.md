# E-model details

Opening one E-model from its listing, under the models section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: E-model details

@private @readonly
Scenario: Open one E-model beside the listing
  Given I am on the E-model listing
  When I click a result
  Then I see its name
  And I see these properties:
    "brain_region", "eModelScore", "mtype"
    "etype", "creation_date", "license"
    "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full E-model page
  Given I have opened one E-model beside the listing
  When I choose to see its details
  Then I land on that E-model's own page
  And I see these parts of the page:
    "metadata-grid"
```
