# Small microcircuit details

Opening one Small microcircuit from its listing, under the simulations section.

A row opens a small panel beside the listing. That panel has a way through to
the full page, which is where the whole record lives.

```gherkin
Feature: Small microcircuit details

@private @readonly
Scenario: Open one Small microcircuit beside the listing
  Given I am on the Small microcircuit listing
  When I click a result
  Then I see its name
  And I see these properties:
    "circuit_name", "legacy_activity_status", "creation_date"
    "lifecycle_status"
  And I can download it
  And I can open its full details

@private @readonly
Scenario: Open the full Small microcircuit page
  Given I have opened one Small microcircuit beside the listing
  When I choose to see its details
  Then I land on that Small microcircuit's own page
  And I see these parts of the page:
    "scan-config-tab-configuration", "scan-config-tab-simulations", "scan-config-root-element-info"
    "scan-config-root-element-initialize", "scan-config-root-element-neuron_sets", "scan-config-root-element-morphology_locations"
    "scan-config-root-element-stimuli", "scan-config-root-element-recordings", "scan-config-root-element-distributions"
    "scan-config-root-element-neuronal_manipulations", "scan-config-root-element-synaptic_manipulations", "scan-config-root-element-timestamps"
    "scan-config-block-info", "scan-config-field-campaign_name", "scan-config-control"
    "scan-config-field-campaign_description", "viewer-scene", "viewer-mode-visualization"
    "viewer-mode-image", "viewer-settings", "color-by-dropdown-trigger"
    "scan-config-coordinate-c1a2dcf5-c0fd-4c3e-b0d5-d9b5efd3948f", "scan-config-status", "scan-params"
    "scan-config-launch", "scan-config-results-files", "scan-config-inputs"
    "task-io-file-item-33042e4d-ff36-4771-b212-d24baa5c3007", "task-io-file-item-00cac619-1da1-4540-822a-36d04db58c03", "task-io-file-item-9e2f4e59-21bf-4812-b2f5-6cd4bd7531d0"
    "task-io-file-item-af043725-3412-48b7-82d0-5e6be2709d49", "scan-config-file-view"
```
