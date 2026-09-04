# Microcircuit details

Opening one Microcircuit from its listing, under the simulations section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Microcircuit details

@private @readonly
Scenario: Open one Microcircuit beside the listing
  Given I am on the Microcircuit listing
  When I click a result
  Then I see its name
  And I see these properties:
    "circuit_name", "legacy_activity_status", "creation_date"
    "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Microcircuit page
  Given I have opened one Microcircuit beside the listing
  When I choose to see its details
  Then I land on that Microcircuit's own page
  And the page opens, though it shows nothing of its own yet
```
