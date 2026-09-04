# Single neuron details

Opening one Single neuron from its listing, under the simulations section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Single neuron details

@private @readonly
Scenario: Open one Single neuron beside the listing
  Given I am on the Single neuron listing
  When I click a result
  Then I see its name
  And I see these properties:
    "circuit_name", "legacy_activity_status", "creation_date"
    "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Single neuron page
  Given I have opened one Single neuron beside the listing
  When I choose to see its details
  Then I land on that Single neuron's own page
  And I see these parts of the page:
    "scan-config-tab-configuration", "scan-config-tab-simulations", "scan-config-root-element-info"
    "scan-config-root-element-initialize", "scan-config-root-element-morphology_locations", "scan-config-root-element-stimuli"
    "scan-config-root-element-recordings", "scan-config-root-element-neuronal_manipulations", "scan-config-root-element-timestamps"
    "scan-config-block-info", "scan-config-field-campaign_name", "scan-config-control"
    "scan-config-field-campaign_description", "viewer-scene", "viewer-mode-visualization"
    "viewer-mode-dendrogram", "viewer-settings", "scan-config-coordinate-837508fc-8c91-43e3-a20e-ff4e584c587a"
    "scan-config-status", "scan-params", "scan-config-launch"
    "scan-config-results-files", "scan-config-inputs", "task-io-file-item-a756ce18-ccaf-45c6-b40b-d47fc18bb674"
    "task-io-file-item-5bbacc23-4cd0-413a-9fbf-5fcbee2453e1", "task-io-file-item-6ba9b18f-bb95-4906-9c51-8b4e4bf02579", "scan-config-file-view"
```
