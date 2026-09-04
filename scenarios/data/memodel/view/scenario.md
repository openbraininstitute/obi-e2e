# ME-model details

Opening one ME-model from its listing, under the models section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: ME-model details

@private @readonly
Scenario: Open one ME-model beside the listing
  Given I am on the ME-model listing
  When I click a result
  Then I see its name
  And I see these properties:
    "brain_region", "mtype", "etype"
    "validation_status", "creation_date", "license"
    "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full ME-model page
  Given I have opened one ME-model beside the listing
  When I choose to see its details
  Then I land on that ME-model's own page
  And I see these parts of the page:
    "metadata-grid"
```
