# Synaptome (legacy) details

Opening one Synaptome (legacy) from its listing, under the models section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Synaptome (legacy) details

@private @readonly
Scenario: Open one Synaptome (legacy) beside the listing
  Given I am on the Synaptome (legacy) listing
  When I click a result
  Then I see its name
  And I see these properties:
    "brain_region", "me_model", "mtype"
    "etype", "creation_date", "license"
    "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Synaptome (legacy) page
  Given I have opened one Synaptome (legacy) beside the listing
  When I choose to see its details
  Then I land on that Synaptome (legacy)'s own page
  And I see these parts of the page:
    "metadata-grid"
```
