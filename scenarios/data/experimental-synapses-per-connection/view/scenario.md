# Synapse per connection details

Opening one Synapse per connection from its listing, under the experimental section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Synapse per connection details

@private @readonly
Scenario: Open one Synapse per connection beside the listing
  Given I am on the Synapse per connection listing
  When I click a result
  Then I see its name
  And I see these properties:
    "pre_region", "post_region", "pre_mtype"
    "post_mtype", "species", "subject_age"
    "license", "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Synapse per connection page
  Given I have opened one Synapse per connection beside the listing
  When I choose to see its details
  Then I land on that Synapse per connection's own page
  And I see these parts of the page:
    "metadata-grid", "subject-details"
```
