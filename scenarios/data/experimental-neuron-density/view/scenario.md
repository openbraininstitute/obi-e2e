# Neuron density details

Opening one Neuron density from its listing, under the experimental section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Neuron density details

@private @readonly
Scenario: Open one Neuron density beside the listing
  Given I am on the Neuron density listing
  When I click a result
  Then I see its name
  And I see these properties:
    "brain_region", "mtype", "species"
    "etype", "license", "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Neuron density page
  Given I have opened one Neuron density beside the listing
  When I choose to see its details
  Then I land on that Neuron density's own page
  And I see these parts of the page:
    "metadata-grid", "subject-details"
```
