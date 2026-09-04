# Electron microscopy circuit build

The Electron microscopy circuit build workflow, under Build on the Workflows
page. It is driven by a scan configuration, from
`data/scan-configs/em-synapse-mapping.json`, and starts from a morphology that
was derived from an electron microscopy dense reconstruction dataset.

Those morphologies belong to a project rather than being public, so the browse
step opens the "Project" tab.

That fixture names no deployment in its `env` list, so the workflow runs nowhere
yet and the suite skips these scenarios on staging and on production both.
Naming a deployment in `env` is what turns them on.

The fixture says nothing about the files a finished coordinate holds, so the run
is only asked to have produced something.

```gherkin
Feature: Electron microscopy circuit build

@private @spends
Scenario: Generate a build campaign from a scan configuration
  Given I am logged in
  And I am inside my project
  When I start the "Build" workflow for "Electron microscopy circuit"
  And I look at my project's own entities
  And I choose the electron microscopy dense reconstruction dataset
  And I choose the morphology the fixture names
  And I fill the configuration from the fixture
  And I press "Generate build(s)"
  Then the "Results" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  And I see the configuration it was generated from

@private @spends
Scenario: Launch the build and let it finish
  Given I have generated an electron microscopy circuit campaign
  When I press "Launch builds"
  And I confirm what it will cost
  Then the coordinate leaves "created"
  And it reaches "done"
  And it has produced something
```
