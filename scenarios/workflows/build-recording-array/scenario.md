# Extracellular recording array build

The Extracellular recording array build workflow, under Build on the Workflows
page. It is driven by a scan configuration, from
`data/scan-configs/extracellular-recording-array.json`, and places one probe over
a circuit.

The workflow sits behind a feature flag, which the fixture names. The flag is set
before the page loads, because the hub renders the card disabled otherwise.

The fixture says nothing about the files a finished coordinate holds, so the run
is only asked to have produced something.

```gherkin
Feature: Extracellular recording array build

@private @spends
Scenario: Generate a build campaign from a scan configuration
  Given I am logged in
  And I am inside my project
  And I have turned on the "Extracellular recording array" experimental feature
  When I start the "Build" workflow for "Extracellular recording array"
  And I choose the circuit the fixture names
  And I fill the configuration from the fixture
  And I press "Generate build(s)"
  Then the "Results" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  And I see the configuration it was generated from

@private @spends
Scenario: Launch the build and let it finish
  Given I have generated a recording array campaign
  When I press "Launch builds"
  And I confirm what it will cost
  Then the coordinate leaves "created"
  And it reaches "done"
  And it has produced something
```
